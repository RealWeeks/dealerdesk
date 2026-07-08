import mongoose, { Schema } from "mongoose";

const vehicleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerId: { type: Schema.Types.ObjectId, ref: "SearchDealer" },
    year: Number,
    make: String,
    model: String,
    trim: String,
    vin: String,
    stockNumber: String,
    msrp: Number,
    listedPrice: Number,
    exteriorColor: String,
    interiorColor: String,
    packages: [String],
    listingUrl: String,
    status: { type: String, enum: ["interested", "contacted", "quoted", "rejected", "finalist", "purchased"], default: "interested" }
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
