import mongoose, { Schema } from "mongoose";

const messageTemplateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["initial_outreach", "follow_up", "otd_request", "add_on_removal", "beat_offer", "final_offer", "polite_decline"], required: true, index: true },
    tone: { type: String, enum: ["casual", "friendly", "firm", "concise"], required: true },
    body: { type: String, required: true },
    variables: [String],
    isBuiltIn: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

messageTemplateSchema.index({ userId: 1, name: 1, category: 1 }, { unique: true });

export const MessageTemplate = mongoose.model("MessageTemplate", messageTemplateSchema);
