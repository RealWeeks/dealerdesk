import { Router } from "express";
import { messageTemplatePatchSchema, messageTemplateSchema } from "@dealdesk/shared";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { MessageTemplate } from "../models/MessageTemplate";
import { MessageTemplateUsage } from "../models/MessageTemplateUsage";
import { SearchDealer } from "../models/SearchDealer";
import { HttpError } from "../utils/httpError";
import { assertObjectId } from "../utils/objectId";

const router = Router();
router.use("/message-templates", requireAuth);

async function requireDealer(userId: string, dealerId: string) {
  assertObjectId(dealerId, "dealerId");
  const dealer = await SearchDealer.findOne({ _id: dealerId, userId });
  if (!dealer) throw new HttpError(404, "Dealer not found");
  return dealer;
}

function isTrue(value: unknown) {
  return value === true || value === "true";
}

router.get("/message-templates", async (req: AuthRequest, res, next) => {
  try {
    const { category, tone, dealerId } = req.query;
    const includeUsed = req.query.includeUsed === undefined ? true : isTrue(req.query.includeUsed);
    if (dealerId) await requireDealer(req.user!.id, String(dealerId));

    const query: Record<string, unknown> = {
      isActive: true,
      $or: [{ isBuiltIn: true, userId: null }, { userId: req.user!.id }]
    };
    if (category) query.category = category;
    if (tone) query.tone = tone;

    const templates = await MessageTemplate.find(query).sort({ isBuiltIn: -1, name: 1 });
    const usages = dealerId
      ? await MessageTemplateUsage.find({ userId: req.user!.id, dealerId: String(dealerId), templateId: { $in: templates.map((template) => template._id) } }).sort({ usedAt: -1 })
      : [];

    const usageByTemplate = new Map<string, Date>();
    for (const usage of usages) {
      const key = String(usage.get("templateId"));
      if (!usageByTemplate.has(key)) usageByTemplate.set(key, usage.get("usedAt") as Date);
    }

    const enriched = templates
      .map((template) => {
        const lastUsedAt = usageByTemplate.get(String(template._id));
        return {
          ...template.toObject(),
          usedWithThisDealer: Boolean(lastUsedAt),
          lastUsedAt: lastUsedAt?.toISOString()
        };
      })
      .filter((template) => includeUsed || !template.usedWithThisDealer)
      .sort((a, b) => Number(a.usedWithThisDealer) - Number(b.usedWithThisDealer) || String(a.name).localeCompare(String(b.name)));

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

router.post("/message-templates", async (req: AuthRequest, res, next) => {
  try {
    const body = messageTemplateSchema.parse(req.body);
    res.status(201).json(await MessageTemplate.create({ ...body, userId: req.user!.id, isBuiltIn: false }));
  } catch (error) {
    next(error);
  }
});

router.patch("/message-templates/:id", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "templateId");
    const body = messageTemplatePatchSchema.parse(req.body);
    const template = await MessageTemplate.findOne({ _id: req.params.id, userId: req.user!.id, isBuiltIn: false });
    if (!template) throw new HttpError(404, "Editable template not found");
    template.set(body);
    res.json(await template.save());
  } catch (error) {
    next(error);
  }
});

router.post("/message-templates/:id/duplicate", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "templateId");
    const source = await MessageTemplate.findOne({ _id: req.params.id, isActive: true, $or: [{ isBuiltIn: true, userId: null }, { userId: req.user!.id }] });
    if (!source) throw new HttpError(404, "Template not found");
    const copy = await MessageTemplate.create({
      userId: req.user!.id,
      name: `${source.get("name")} Copy`,
      category: source.get("category"),
      tone: source.get("tone"),
      body: source.get("body"),
      variables: source.get("variables"),
      isBuiltIn: false,
      isActive: true
    });
    res.status(201).json(copy);
  } catch (error) {
    next(error);
  }
});

router.delete("/message-templates/:id", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "templateId");
    const template = await MessageTemplate.findOne({ _id: req.params.id, userId: req.user!.id, isBuiltIn: false });
    if (!template) throw new HttpError(404, "Editable template not found");
    template.set("isActive", false);
    await template.save();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
