import mongoose, { Schema } from "mongoose";

const addOnSchema = new Schema({ name: String, amount: Number, required: Boolean }, { _id: false });

const offerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerId: { type: Schema.Types.ObjectId, ref: "SearchDealer", required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    msrp: Number,
    sellingPrice: Number,
    dealerDiscount: Number,
    incentives: Number,
    docFee: Number,
    tax: Number,
    titleRegistration: Number,
    deliveryFee: Number,
    addOns: [addOnSchema],
    tradeAllowance: Number,
    payoff: Number,
    apr: Number,
    termMonths: Number,
    monthlyPayment: Number,
    downPayment: Number,
    otdPrice: Number,
    quoteCompleteness: { type: String, enum: ["complete", "partial", "unclear"], default: "partial" },
    redFlags: [String],
    missingInfo: [String],
    sourceType: { type: String, enum: ["manual", "paste", "screenshot", "dictation"], default: "manual" },
    sourceText: String,
    confidence: { type: String, enum: ["low", "medium", "high"], default: "medium" }
  },
  { timestamps: true }
);

export const Offer = mongoose.model("Offer", offerSchema);
