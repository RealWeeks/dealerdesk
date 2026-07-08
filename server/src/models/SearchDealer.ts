import mongoose, { Schema } from "mongoose";

const searchDealerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerSeedId: { type: Schema.Types.ObjectId, ref: "DealerSeed", required: true },
    name: String,
    brand: String,
    city: String,
    state: String,
    phone: String,
    websiteUrl: String,
    inventoryUrl: String,
    distanceMiles: Number,
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    status: { type: String, enum: ["not_contacted", "contacted", "needs_reply", "quoted", "negotiating", "rejected", "finalist", "purchased_from"], default: "not_contacted" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    notes: String,
    lastContactedAt: Date,
    nextFollowUpAt: Date
  },
  { timestamps: true }
);

searchDealerSchema.index({ userId: 1, carSearchId: 1, dealerSeedId: 1 }, { unique: true });
export const SearchDealer = mongoose.model("SearchDealer", searchDealerSchema);
