import { DealerSeed } from "../models/DealerSeed";
import { DealerSearchCoverage } from "../models/DealerSearchCoverage";
import { haversineMiles } from "../utils/haversine";
import { zipCoordinates } from "../utils/zipCoordinates";
import { HttpError } from "../utils/httpError";

export type GeoPoint = { latitude: number; longitude: number; city?: string; state?: string };
export type OverpassElement = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};
export type DiscoveredDealer = {
  _id: string;
  name: string;
  brand: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  websiteUrl?: string;
  inventoryUrl?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles: number;
};

// Serve a covered, still-fresh area straight from our DB.
const COVERAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MILES_PER_METER = 1 / 1609.34;
// Public Overpass mirrors, tried in order for resilience against overload/rate limits.
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

// OSM `brand` tags follow canonical casing; the query below is an exact match (fast,
// index-backed) so we normalize the user's input to match. Odd casings (acronyms,
// hyphenated, abbreviations) get a canonical mapping; everything else is Title Cased.
const BRAND_CANON: Record<string, string> = {
  bmw: "BMW", gmc: "GMC", ram: "Ram", mini: "MINI", mg: "MG",
  vw: "Volkswagen", volkswagen: "Volkswagen", chevy: "Chevrolet", chevrolet: "Chevrolet",
  mercedes: "Mercedes-Benz", "mercedes-benz": "Mercedes-Benz", "mercedes benz": "Mercedes-Benz",
  "land rover": "Land Rover", landrover: "Land Rover", "alfa romeo": "Alfa Romeo",
  "rolls royce": "Rolls-Royce", "rolls-royce": "Rolls-Royce"
};

export function normalizeBrand(brand: string): string {
  const key = brand.trim().toLowerCase();
  if (BRAND_CANON[key]) return BRAND_CANON[key];
  return key.replace(/\b\w/g, (char) => char.toUpperCase());
}

// --- Injectable IO seam (network) so tests stay hermetic (mirrors vehicleCaptureService) ---
export interface DealerDiscoveryIO {
  geocodeZip(zip: string): Promise<GeoPoint | null>;
  searchOverpass(input: { latitude: number; longitude: number; radiusMiles: number; brand: string }): Promise<OverpassElement[]>;
}

async function defaultGeocodeZip(zip: string): Promise<GeoPoint | null> {
  const known = zipCoordinates[zip];
  if (known) return known;
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
    headers: { "User-Agent": "DealDesk/0.1 (dealer discovery)" }
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { places?: { latitude: string; longitude: string; "place name"?: string; "state abbreviation"?: string }[] };
  const place = body.places?.[0];
  if (!place) return null;
  return {
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    city: place["place name"],
    state: place["state abbreviation"]
  };
}

// Exact brand-tag match keeps this fast (~2-3s) even over a large radius — an
// index-backed lookup that returns only the brand's dealers, vs. scanning every
// car dealer in the area (~18s) or a case-insensitive regex (~80s).
async function defaultSearchOverpass(input: { latitude: number; longitude: number; radiusMiles: number; brand: string }): Promise<OverpassElement[]> {
  const meters = Math.round(input.radiusMiles / MILES_PER_METER);
  const brand = normalizeBrand(input.brand).replace(/["\\]/g, "\\$&");
  const query = `[out:json][timeout:25];nwr["shop"="car"]["brand"="${brand}"](around:${meters},${input.latitude},${input.longitude});out center tags;`;
  let lastError: unknown = new HttpError(502, "Dealer directory unavailable");
  for (const endpoint of OVERPASS_MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "DealDesk/0.1 (dealer discovery)" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });
      if (!res.ok) throw new HttpError(502, `Dealer directory returned ${res.status}`);
      const body = (await res.json()) as { elements?: OverpassElement[] };
      return body.elements ?? [];
    } catch (error) {
      lastError = error; // try the next mirror
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

const defaultIO: DealerDiscoveryIO = { geocodeZip: defaultGeocodeZip, searchOverpass: defaultSearchOverpass };
let io: DealerDiscoveryIO = defaultIO;

export function setDealerDiscoveryIO(next: Partial<DealerDiscoveryIO>) {
  io = { ...io, ...next };
}
export function resetDealerDiscoveryIO() {
  io = defaultIO;
}

// Safe dealerKey (mirrors DealerSeed's normalizer) — computed explicitly because
// findOneAndUpdate upserts don't run the model's pre-validate hook.
function dealerKeyOf(parts: { brand?: string; name?: string; city?: string; state?: string }) {
  return [parts.brand, parts.name, parts.city, parts.state]
    .map((part) => String(part ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join(":");
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function toDealerInput(element: OverpassElement, place: GeoPoint) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ").trim() || undefined;
  return {
    name: tags.name?.trim(),
    brand: (tags.brand || tags.name || "").trim(),
    address: street,
    city: tags["addr:city"] || place.city,
    state: tags["addr:state"] || place.state,
    phone: tags.phone || tags["contact:phone"],
    websiteUrl: tags.website || tags["contact:website"],
    latitude: typeof lat === "number" ? lat : undefined,
    longitude: typeof lon === "number" ? lon : undefined
  };
}

function brandMatches(candidateBrand: string, candidateName: string | undefined, requested: string) {
  const q = requested.trim().toLowerCase();
  if (!q) return true;
  return candidateBrand.toLowerCase().includes(q) || (candidateName ?? "").toLowerCase().includes(q);
}

function withDistance(dealer: Record<string, unknown>, origin: GeoPoint): DiscoveredDealer | null {
  const latitude = Number(dealer.latitude);
  const longitude = Number(dealer.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const distanceMiles = round(haversineMiles(origin, { latitude, longitude }));
  return { ...(dealer as object), latitude, longitude, distanceMiles } as DiscoveredDealer;
}

// Reads our own cached OSM findings for a brand near a point.
async function readCachedDealers(brand: string, origin: GeoPoint, radiusMiles: number): Promise<DiscoveredDealer[]> {
  const safe = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rows = await DealerSeed.find({ source: "osm", $or: [{ brand: new RegExp(safe, "i") }, { name: new RegExp(safe, "i") }] });
  return rows
    .map((row) => withDistance(row.toObject() as Record<string, unknown>, origin))
    .filter((dealer): dealer is DiscoveredDealer => dealer !== null && dealer.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

// Coverage is per brand + area: a fresh, enclosing prior fetch means we serve from DB.
async function isAreaCovered(brand: string, origin: GeoPoint, radiusMiles: number): Promise<boolean> {
  const fresh = new Date(Date.now() - COVERAGE_TTL_MS);
  const rows = await DealerSearchCoverage.find({ brand: brand.trim().toLowerCase(), fetchedAt: { $gte: fresh } });
  return rows.some((row) => {
    const center = { latitude: Number(row.get("latitude")), longitude: Number(row.get("longitude")) };
    const gap = haversineMiles(center, origin);
    return gap + radiusMiles <= Number(row.get("radiusMiles"));
  });
}

export async function discoverDealers(input: { brand: string; zip: string; radiusMiles: number; refresh?: boolean }): Promise<{ dealers: DiscoveredDealer[]; warnings: string[] }> {
  const warnings: string[] = [];
  const place = await io.geocodeZip(input.zip);
  if (!place) throw new HttpError(400, "Couldn't locate that ZIP code");

  // Cache-first: serve a covered, fresh area from our DB and skip the external API.
  if (!input.refresh && (await isAreaCovered(input.brand, place, input.radiusMiles))) {
    return { dealers: await readCachedDealers(input.brand, place, input.radiusMiles), warnings };
  }

  let elements: OverpassElement[];
  try {
    elements = await io.searchOverpass({ latitude: place.latitude, longitude: place.longitude, radiusMiles: input.radiusMiles, brand: input.brand });
  } catch {
    // Graceful degradation — fall back to whatever we already have cached.
    warnings.push("Couldn't reach the dealer directory just now. Showing any saved results; try again shortly.");
    return { dealers: await readCachedDealers(input.brand, place, input.radiusMiles), warnings };
  }

  const now = new Date();
  const dealers: DiscoveredDealer[] = [];
  for (const element of elements) {
    const draft = toDealerInput(element, place);
    if (!draft.name || !draft.brand) continue;
    if (!brandMatches(draft.brand, draft.name, input.brand)) continue;
    if (!Number.isFinite(Number(draft.latitude)) || !Number.isFinite(Number(draft.longitude))) continue;
    const distanceMiles = round(haversineMiles(place, { latitude: Number(draft.latitude), longitude: Number(draft.longitude) }));
    if (distanceMiles > input.radiusMiles) continue;

    const dealerKey = dealerKeyOf(draft);
    const saved = await DealerSeed.findOneAndUpdate(
      { dealerKey },
      { $set: { ...draft, dealerKey, source: "osm", needsVerification: true, lastVerifiedAt: now } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    dealers.push({ ...(saved!.toObject() as object), distanceMiles } as DiscoveredDealer);
  }

  await DealerSearchCoverage.create({ brand: input.brand.trim().toLowerCase(), latitude: place.latitude, longitude: place.longitude, radiusMiles: input.radiusMiles, fetchedAt: now });

  dealers.sort((a, b) => a.distanceMiles - b.distanceMiles);
  return { dealers, warnings };
}
