import mongoose, { Schema } from "mongoose";

const dealerSeedSchema = new Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true, index: true },
    address: String,
    city: String,
    state: String,
    zip: String,
    phone: String,
    websiteUrl: String,
    inventoryUrl: String,
    latitude: Number,
    longitude: Number,
    source: String,
    lastVerifiedAt: Date,
    needsVerification: { type: Boolean, default: false },
    dealerKey: { type: String, required: true }
  },
  { timestamps: true }
);

function normalizeDealerKey(doc: { brand?: unknown; name?: unknown; city?: unknown; state?: unknown }) {
  return [doc.brand, doc.name, doc.city, doc.state]
    .map((part) => String(part ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join(":");
}

dealerSeedSchema.pre("validate", function () {
  if (!this.get("dealerKey")) this.set("dealerKey", normalizeDealerKey(this.toObject()));
});

dealerSeedSchema.index({ brand: 1, zip: 1 });
dealerSeedSchema.index({ dealerKey: 1 }, { unique: true });
export const DealerSeed = mongoose.model("DealerSeed", dealerSeedSchema);
