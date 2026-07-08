import mongoose, { Schema } from "mongoose";

const messageTemplateUsageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerId: { type: Schema.Types.ObjectId, ref: "SearchDealer", required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: "MessageTemplate" },
    interactionId: { type: Schema.Types.ObjectId, ref: "Interaction" },
    usedBody: { type: String, required: true },
    usedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

messageTemplateUsageSchema.index({ userId: 1, dealerId: 1, templateId: 1, usedAt: -1 });

export const MessageTemplateUsage = mongoose.model("MessageTemplateUsage", messageTemplateUsageSchema);
