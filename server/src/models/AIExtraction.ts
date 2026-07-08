import mongoose, { Schema } from "mongoose";

const aiExtractionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerId: { type: Schema.Types.ObjectId, ref: "SearchDealer" },
    inputType: { type: String, enum: ["dealer_message", "call_note", "listing", "quote"], required: true },
    rawInput: String,
    extractedJson: Schema.Types.Mixed,
    confidence: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    redFlags: [String],
    missingInfo: [String],
    suggestedNextStep: String,
    suggestedReply: String,
    userConfirmed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const AIExtraction = mongoose.model("AIExtraction", aiExtractionSchema);
