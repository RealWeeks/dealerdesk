import { Router } from "express";
import { initialOutreachMessageSchema, markOutreachContactedSchema } from "@dealdesk/shared";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { CarSearch } from "../models/CarSearch";
import { Interaction } from "../models/Interaction";
import { MessageTemplate } from "../models/MessageTemplate";
import { MessageTemplateUsage } from "../models/MessageTemplateUsage";
import { Offer } from "../models/Offer";
import { SearchDealer } from "../models/SearchDealer";
import { Task } from "../models/Task";
import { buildInitialOutreachMessage, renderTemplateBody } from "../services/outreachService";
import { HttpError } from "../utils/httpError";
import { assertObjectId } from "../utils/objectId";

const router = Router();
router.use("/outreach", requireAuth);

async function requireSearch(userId: string, carSearchId: string) {
  assertObjectId(carSearchId, "carSearchId");
  const search = await CarSearch.findOne({ _id: carSearchId, userId });
  if (!search) throw new HttpError(404, "Car search not found");
  return search;
}

async function requireDealerForSearch(userId: string, dealerId: string, carSearchId: string) {
  assertObjectId(dealerId, "dealerId");
  const dealer = await SearchDealer.findOne({ _id: dealerId, userId, carSearchId });
  if (!dealer) throw new HttpError(404, "Dealer not found for this search");
  return dealer;
}

async function requireVisibleTemplate(userId: string, templateId: string) {
  assertObjectId(templateId, "templateId");
  const template = await MessageTemplate.findOne({ _id: templateId, isActive: true, $or: [{ isBuiltIn: true, userId: null }, { userId }] });
  if (!template) throw new HttpError(404, "Template not found");
  return template;
}

router.post("/outreach/initial-message", async (req: AuthRequest, res, next) => {
  try {
    const body = initialOutreachMessageSchema.parse(req.body);
    const search = await requireSearch(req.user!.id, body.carSearchId);
    const dealer = body.dealerId ? await requireDealerForSearch(req.user!.id, body.dealerId, body.carSearchId) : undefined;

    let selected = body.templateId ? await requireVisibleTemplate(req.user!.id, body.templateId) : null;
    let usedWithThisDealer = false;
    let lastUsedAt: Date | undefined;

    if (!selected) {
      const templates = await MessageTemplate.find({
        category: "initial_outreach",
        isActive: true,
        $or: [{ isBuiltIn: true, userId: null }, { userId: req.user!.id }]
      }).sort({ isBuiltIn: -1, name: 1 });

      if (templates.length && dealer) {
        const usages = await MessageTemplateUsage.find({ userId: req.user!.id, dealerId: dealer._id, templateId: { $in: templates.map((template) => template._id) } }).sort({ usedAt: -1 });
        const lastUsageByTemplate = new Map<string, Date>();
        for (const usage of usages) {
          const key = String(usage.get("templateId"));
          if (!lastUsageByTemplate.has(key)) lastUsageByTemplate.set(key, usage.get("usedAt") as Date);
        }
        selected = templates.find((template) => !lastUsageByTemplate.has(String(template._id))) ?? [...templates].sort((a, b) => {
          const aTime = lastUsageByTemplate.get(String(a._id))?.getTime() ?? 0;
          const bTime = lastUsageByTemplate.get(String(b._id))?.getTime() ?? 0;
          return aTime - bTime;
        })[0];
        lastUsedAt = selected ? lastUsageByTemplate.get(String(selected._id)) : undefined;
        usedWithThisDealer = Boolean(lastUsedAt);
      } else {
        selected = templates[0] ?? null;
      }
    } else if (dealer) {
      const usage = await MessageTemplateUsage.findOne({ userId: req.user!.id, dealerId: dealer._id, templateId: selected._id }).sort({ usedAt: -1 });
      lastUsedAt = usage?.get("usedAt") as Date | undefined;
      usedWithThisDealer = Boolean(usage);
    }

    if (!selected) return res.json(buildInitialOutreachMessage(search));

    res.json({
      templateId: selected._id,
      templateName: selected.get("name"),
      category: selected.get("category"),
      tone: selected.get("tone"),
      messageText: renderTemplateBody(String(selected.get("body")), search, dealer),
      strategyNotes: usedWithThisDealer
        ? "This template has already been used with this dealer. It was selected because every active initial outreach template has been used."
        : "Unused initial outreach template selected for this dealer.",
      usedWithThisDealer,
      lastUsedAt: lastUsedAt?.toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/outreach/mark-contacted", async (req: AuthRequest, res, next) => {
  try {
    const body = markOutreachContactedSchema.parse(req.body);
    await requireSearch(req.user!.id, body.carSearchId);
    const template = body.templateId ? await requireVisibleTemplate(req.user!.id, body.templateId) : null;
    const uniqueDealerIds = [...new Set(body.dealerIds)];
    uniqueDealerIds.forEach((dealerId) => assertObjectId(dealerId, "dealerId"));

    const dealers = await SearchDealer.find({ _id: { $in: uniqueDealerIds }, userId: req.user!.id, carSearchId: body.carSearchId });
    if (dealers.length !== uniqueDealerIds.length) throw new HttpError(404, "One or more dealers were not found for this search");

    const now = new Date();
    const duplicateWindowStart = new Date(now.getTime() - 10 * 60 * 1000);
    const followUpDueAt = body.followUpDueAt ?? new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const interactions = [];
    const tasks = [];
    const templateUsages = [];
    const updatedDealers = [];

    for (const dealer of dealers) {
      const existingInteraction = await Interaction.findOne({
        userId: req.user!.id,
        carSearchId: body.carSearchId,
        dealerId: dealer._id,
        direction: "outbound",
        rawContent: body.messageText,
        createdAt: { $gte: duplicateWindowStart }
      }).sort({ createdAt: -1 });

      const interaction = existingInteraction ?? await Interaction.create({
        userId: req.user!.id,
        carSearchId: body.carSearchId,
        dealerId: dealer._id,
        type: "email",
        direction: "outbound",
        rawContent: body.messageText,
        aiSummary: "Initial outreach message saved by user.",
        aiSuggestedNextStep: "Follow up in two days if no response."
      });
      interactions.push(interaction);

      const existingUsage = await MessageTemplateUsage.findOne({
        userId: req.user!.id,
        carSearchId: body.carSearchId,
        dealerId: dealer._id,
        templateId: template?._id,
        interactionId: interaction._id
      });
      if (!existingUsage) {
        templateUsages.push(await MessageTemplateUsage.create({
          userId: req.user!.id,
          carSearchId: body.carSearchId,
          dealerId: dealer._id,
          templateId: template?._id,
          interactionId: interaction._id,
          usedBody: body.messageText,
          usedAt: now
        }));
      } else {
        templateUsages.push(existingUsage);
      }

      dealer.set("status", "contacted");
      dealer.set("lastContactedAt", now);
      dealer.set("nextFollowUpAt", body.createFollowUp ? followUpDueAt : undefined);
      updatedDealers.push(await dealer.save());

      if (body.createFollowUp) {
        const title = `Follow up with ${dealer.get("name")}`;
        const existingTask = await Task.findOne({
          userId: req.user!.id,
          carSearchId: body.carSearchId,
          dealerId: dealer._id,
          title,
          status: "open"
        });
        tasks.push(existingTask ?? await Task.create({
          userId: req.user!.id,
          carSearchId: body.carSearchId,
          dealerId: dealer._id,
          title,
          dueAt: followUpDueAt,
          status: "open"
        }));
      }
    }

    res.json({
      dealers: updatedDealers,
      interactions,
      tasks,
      templateUsages,
      offersCreated: await Offer.countDocuments({ userId: req.user!.id, carSearchId: body.carSearchId, createdAt: { $gte: now } })
    });
  } catch (error) {
    next(error);
  }
});

export default router;
