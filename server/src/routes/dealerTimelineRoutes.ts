import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { AIExtraction } from "../models/AIExtraction";
import { Interaction } from "../models/Interaction";
import { MessageTemplate } from "../models/MessageTemplate";
import { MessageTemplateUsage } from "../models/MessageTemplateUsage";
import { Offer } from "../models/Offer";
import { SearchDealer } from "../models/SearchDealer";
import { Task } from "../models/Task";
import { HttpError } from "../utils/httpError";
import { assertObjectId } from "../utils/objectId";

const router = Router();
router.use("/dealers", requireAuth);

type TimelineItem = {
  id: string;
  type: "interaction" | "offer" | "task" | "ai_extraction" | "template_usage" | "dealer_status";
  occurredAt: Date;
  title: string;
  summary: string;
  metadata: Record<string, unknown>;
};

router.get("/dealers/:dealerId/timeline", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.dealerId, "dealerId");
    const dealer = await SearchDealer.findOne({ _id: req.params.dealerId, userId: req.user!.id });
    if (!dealer) throw new HttpError(404, "Dealer not found");

    const [interactions, offers, tasks, extractions, usages] = await Promise.all([
      Interaction.find({ userId: req.user!.id, dealerId: dealer._id }),
      Offer.find({ userId: req.user!.id, dealerId: dealer._id }),
      Task.find({ userId: req.user!.id, dealerId: dealer._id }),
      AIExtraction.find({ userId: req.user!.id, dealerId: dealer._id }),
      MessageTemplateUsage.find({ userId: req.user!.id, dealerId: dealer._id })
    ]);
    const templates = await MessageTemplate.find({ _id: { $in: usages.map((usage) => usage.get("templateId")).filter(Boolean) } });
    const templateById = new Map(templates.map((template) => [String(template._id), template]));

    const items: TimelineItem[] = [
      ...interactions.map((interaction) => ({
        id: String(interaction._id),
        type: "interaction" as const,
        occurredAt: interaction.get("createdAt"),
        title: interaction.get("direction") === "outbound" ? "Outbound message sent" : "Dealer message saved",
        summary: interaction.get("rawContent") ?? "",
        metadata: interaction.toObject() as Record<string, unknown>
      })),
      ...offers.map((offer) => ({
        id: String(offer._id),
        type: "offer" as const,
        occurredAt: offer.get("createdAt"),
        title: offer.get("otdPrice") ? `Offer saved: $${Number(offer.get("otdPrice")).toLocaleString()} OTD` : "Offer saved",
        summary: `${offer.get("quoteCompleteness") ?? "partial"} quote`,
        metadata: offer.toObject() as Record<string, unknown>
      })),
      ...tasks.map((task) => ({
        id: String(task._id),
        type: "task" as const,
        occurredAt: (task.get("createdAt") ?? task.get("dueAt") ?? new Date()) as Date,
        title: "Follow-up task created",
        summary: task.get("title") ?? "",
        metadata: task.toObject() as Record<string, unknown>
      })),
      ...extractions.map((extraction) => ({
        id: String(extraction._id),
        type: "ai_extraction" as const,
        occurredAt: extraction.get("createdAt"),
        title: "AI extraction created from pasted dealer message",
        summary: extraction.get("suggestedNextStep") ?? "",
        metadata: extraction.toObject() as Record<string, unknown>
      })),
      ...usages.map((usage) => {
        const template = templateById.get(String(usage.get("templateId")));
        return {
          id: String(usage._id),
          type: "template_usage" as const,
          occurredAt: usage.get("usedAt"),
          title: template ? `Initial outreach template used: ${template.get("name")}` : "Message template used",
          summary: usage.get("usedBody") ?? "",
          metadata: usage.toObject() as Record<string, unknown>
        };
      })
    ];

    if (dealer.get("lastContactedAt")) {
      items.push({
        id: `${dealer._id}:contacted`,
        type: "dealer_status" as const,
        occurredAt: dealer.get("lastContactedAt") as Date,
        title: "Dealer marked contacted",
        summary: String(dealer.get("status")),
        metadata: { status: dealer.get("status") } as Record<string, unknown>
      });
    }

    items.sort((a, b) => new Date(b.occurredAt as Date).getTime() - new Date(a.occurredAt as Date).getTime());
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

export default router;
