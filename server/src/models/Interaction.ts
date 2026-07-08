import mongoose, { Schema } from "mongoose";

const interactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerId: { type: Schema.Types.ObjectId, ref: "SearchDealer" },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer" },
    type: { type: String, enum: ["email", "text", "phone", "in_person", "note"], required: true },
    direction: { type: String, enum: ["inbound", "outbound", "internal"], required: true },
    rawContent: String,
    aiSummary: String,
    aiSuggestedNextStep: String
  },
  { timestamps: true }
);

export const Interaction = mongoose.model("Interaction", interactionSchema);
