import mongoose, { Schema } from "mongoose";

const carSearchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    year: Number,
    make: String,
    model: String,
    trim: String,
    zipCode: String,
    searchRadiusMiles: Number,
    targetSellingPrice: Number,
    targetOtdPrice: Number,
    willingToTravel: { type: Boolean, default: true },
    willingToShip: { type: Boolean, default: false },
    tradeInStrategy: { type: String, enum: ["separate", "included", "none"], default: "separate" },
    financingStrategy: { type: String, enum: ["separate", "included", "cash"], default: "separate" },
    status: { type: String, enum: ["active", "paused", "purchased"], default: "active" }
  },
  { timestamps: true }
);

export const CarSearch = mongoose.model("CarSearch", carSearchSchema);
