import mongoose, { Schema } from "mongoose";

// Records each brand + area we've fetched live from the dealer directory, so repeat
// searches of a covered, still-fresh area are served from our own DealerSeed cache
// instead of hitting the external API again.
const dealerSearchCoverageSchema = new Schema(
  {
    brand: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMiles: { type: Number, required: true },
    fetchedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const DealerSearchCoverage = mongoose.model("DealerSearchCoverage", dealerSearchCoverageSchema);
