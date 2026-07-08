import { CarSearch } from "../models/CarSearch";
import { DealerSeed } from "../models/DealerSeed";
import { Offer } from "../models/Offer";
import { SearchDealer } from "../models/SearchDealer";
import { User } from "../models/User";
import { haversineMiles } from "../utils/haversine";
import { zipCoordinates } from "../utils/zipCoordinates";
import { lexusNewEnglandDealers, type DealerSeedInput } from "./lexusNewEnglandDealers";

type SeedOptions = {
  dryRun?: boolean;
  dealers?: DealerSeedInput[];
};

type AttachOptions = {
  email: string;
  brand?: string;
  radius?: number;
  dryRun?: boolean;
};

export function normalizeDealerKey(dealer: Pick<DealerSeedInput, "brand" | "name" | "city" | "state">) {
  return [dealer.brand, dealer.name, dealer.city, dealer.state]
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join(":");
}

function missingFields(dealer: DealerSeedInput) {
  return ["name", "brand", "city", "state", "source"].filter((field) => !dealer[field as keyof DealerSeedInput]);
}

function hasCoordinates(dealer: { latitude?: unknown; longitude?: unknown }) {
  return Number.isFinite(Number(dealer.latitude)) && Number.isFinite(Number(dealer.longitude));
}

function priorityForDistance(distanceMiles: number) {
  if (distanceMiles <= 75) return "high";
  if (distanceMiles <= 150) return "medium";
  return "low";
}

export async function seedDealerSeeds({ dryRun = false, dealers = lexusNewEnglandDealers }: SeedOptions = {}) {
  const report = {
    inserted: [] as DealerSeedInput[],
    updated: [] as DealerSeedInput[],
    missingCoordinates: [] as DealerSeedInput[],
    missingRequiredFields: [] as { dealer: DealerSeedInput; fields: string[] }[]
  };

  for (const dealer of dealers) {
    const fields = missingFields(dealer);
    if (fields.length) report.missingRequiredFields.push({ dealer, fields });
    if (!hasCoordinates(dealer)) report.missingCoordinates.push(dealer);

    const dealerKey = normalizeDealerKey(dealer);
    const existing = await DealerSeed.findOne({ dealerKey });
    const payload = { ...dealer, dealerKey };
    if (existing) report.updated.push(dealer);
    else report.inserted.push(dealer);
    if (!dryRun) await DealerSeed.updateOne({ dealerKey }, { $set: payload }, { upsert: true });
  }

  return report;
}

export async function attachSeededDealers({ email, brand = "Lexus", radius, dryRun = false }: AttachOptions) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error(`User not found for email: ${email}`);

  const search = await CarSearch.findOne({ userId: user._id, status: "active" }).sort({ updatedAt: -1 });
  if (!search) throw new Error(`No active car search found for ${email}. Create one in the app before attaching dealers.`);

  const origin = zipCoordinates[String(search.get("zipCode"))];
  if (!origin) throw new Error(`Unsupported active search ZIP for radius attach: ${search.get("zipCode")}`);

  const maxRadius = radius ?? Number(search.get("searchRadiusMiles") ?? 150);
  const offersBefore = await Offer.countDocuments({ userId: user._id, carSearchId: search._id });
  const seeds = await DealerSeed.find({ brand: new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  const report = {
    attached: [] as { name: string; distanceMiles: number; priority: string }[],
    alreadyAttached: [] as { name: string; distanceMiles: number }[],
    skippedOutOfRadius: [] as { name: string; distanceMiles: number; radius: number }[],
    skippedMissingCoordinates: [] as string[],
    offersCreated: 0
  };

  for (const seed of seeds) {
    if (!hasCoordinates(seed.toObject())) {
      report.skippedMissingCoordinates.push(String(seed.get("name")));
      continue;
    }
    const distanceMiles = Math.round(haversineMiles(origin, { latitude: Number(seed.get("latitude")), longitude: Number(seed.get("longitude")) }) * 10) / 10;
    if (distanceMiles > maxRadius) {
      report.skippedOutOfRadius.push({ name: String(seed.get("name")), distanceMiles, radius: maxRadius });
      continue;
    }

    const existing = await SearchDealer.findOne({ userId: user._id, carSearchId: search._id, dealerSeedId: seed._id });
    if (existing) {
      report.alreadyAttached.push({ name: String(seed.get("name")), distanceMiles });
      continue;
    }

    const priority = priorityForDistance(distanceMiles);
    report.attached.push({ name: String(seed.get("name")), distanceMiles, priority });
    if (!dryRun) {
      await SearchDealer.create({
        userId: user._id,
        carSearchId: search._id,
        dealerSeedId: seed._id,
        name: seed.get("name"),
        brand: seed.get("brand"),
        city: seed.get("city"),
        state: seed.get("state"),
        phone: seed.get("phone"),
        websiteUrl: seed.get("websiteUrl"),
        inventoryUrl: seed.get("inventoryUrl"),
        distanceMiles,
        status: "not_contacted",
        priority
      });
    }
  }

  const offersAfter = await Offer.countDocuments({ userId: user._id, carSearchId: search._id });
  report.offersCreated = offersAfter - offersBefore;
  return report;
}
