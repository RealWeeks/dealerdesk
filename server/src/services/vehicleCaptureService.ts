import type { AIParsedListing } from "@dealdesk/shared";
import { parseListingWithAI } from "./aiService";
import { HttpError } from "../utils/httpError";

type VehicleDraft = AIParsedListing["vehicle"];

// OCR + the network fetch are the only parts that touch native libs / the
// network. They live behind this seam so tests inject canned text/HTML and
// never load Tesseract or hit a real URL. All parsing stays in-process and
// testable.
export interface CaptureIO {
  ocrImage(base64: string): Promise<string>;
  fetchListingHtml(url: string): Promise<string>;
}

function stripDataUrl(base64: string) {
  return base64.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnyField(vehicle: VehicleDraft) {
  return Object.values(vehicle).some((value) =>
    value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0));
}

// Fill only the fields the target is still missing — reliable sources (JSON-LD)
// keep priority over later, fuzzier ones (regex, then AI).
function fillGaps(target: VehicleDraft, source: VehicleDraft): VehicleDraft {
  const merged: VehicleDraft = { ...target };
  for (const [key, value] of Object.entries(source) as [keyof VehicleDraft, unknown][]) {
    const current = merged[key];
    const emptyCurrent = current === undefined || current === null || current === "" || (Array.isArray(current) && current.length === 0);
    const hasValue = value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
    if (emptyCurrent && hasValue) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

function isSufficient(vehicle: VehicleDraft) {
  const hasIdentity = Boolean((vehicle.make && vehicle.model) || vehicle.vin);
  const hasPrice = Boolean(vehicle.listedPrice || vehicle.msrp);
  return hasIdentity && hasPrice;
}

function toYear(value: unknown): number | undefined {
  const match = String(value ?? "").match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value ?? "").match(/[0-9][0-9,]*(\.[0-9]+)?/);
  return match ? Number(match[0].replace(/,/g, "")) : undefined;
}

// --- Free method 1: schema.org Vehicle/Car JSON-LD embedded in the page ---
function vehicleFromJsonLdNode(node: Record<string, unknown>): VehicleDraft {
  const brand = node.brand as Record<string, unknown> | string | undefined;
  const model = node.model as Record<string, unknown> | string | undefined;
  const offers = (Array.isArray(node.offers) ? node.offers[0] : node.offers) as Record<string, unknown> | undefined;
  return {
    year: toYear(node.vehicleModelDate ?? node.modelDate ?? node.productionDate ?? node.releaseDate),
    make: typeof brand === "string" ? brand : (brand?.name as string | undefined),
    model: typeof model === "string" ? model : (model?.name as string | undefined),
    trim: (node.vehicleConfiguration as string | undefined) ?? (node.trim as string | undefined),
    vin: node.vehicleIdentificationNumber as string | undefined,
    stockNumber: (node.sku as string | undefined) ?? (node.mpn as string | undefined),
    exteriorColor: node.color as string | undefined,
    listedPrice: toNumber(offers?.price ?? node.price),
    listingUrl: node.url as string | undefined
  };
}

function collectJsonLdNodes(value: unknown, out: Record<string, unknown>[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, out);
  } else if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    out.push(node);
    if (node["@graph"]) collectJsonLdNodes(node["@graph"], out);
  }
}

function structuredVehicleFromHtml(html: string): VehicleDraft {
  let vehicle: VehicleDraft = {};
  const scripts = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1].trim());
    } catch {
      continue;
    }
    const nodes: Record<string, unknown>[] = [];
    collectJsonLdNodes(parsed, nodes);
    for (const node of nodes) {
      const type = String(node["@type"] ?? "").toLowerCase();
      if (/vehicle|car|product/.test(type)) {
        vehicle = fillGaps(vehicle, vehicleFromJsonLdNode(node));
      }
    }
  }
  // OpenGraph price as a light backup when JSON-LD lacks it.
  if (!vehicle.listedPrice) {
    const ogPrice = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i)?.[1];
    if (ogPrice) vehicle = fillGaps(vehicle, { listedPrice: toNumber(ogPrice) });
  }
  return vehicle;
}

// --- Free method 2: regex heuristics over plain text (OCR output or stripped HTML) ---
function heuristicVehicleFromText(text: string): VehicleDraft {
  const vin = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i)?.[1];
  const stockNumber = text.match(/stock\s*#?\s*:?\s*([A-Z0-9-]{3,})/i)?.[1];
  const price = text.match(/\$\s?([0-9]{2,3},?[0-9]{3})/)?.[1];
  return {
    year: toYear(text),
    vin: vin ? vin.toUpperCase() : undefined,
    stockNumber,
    listedPrice: price ? Number(price.replace(/,/g, "")) : undefined
  };
}

async function defaultOcrImage(base64: string): Promise<string> {
  // Dynamic import keeps tesseract.js out of the startup/test path.
  const { recognize } = await import("tesseract.js");
  const buffer = Buffer.from(stripDataUrl(base64), "base64");
  const result = await recognize(buffer, "eng");
  return result.data.text ?? "";
}

async function defaultFetchListingHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (DealDesk listing capture)" } });
  if (!res.ok) throw new HttpError(502, `Could not fetch the listing (status ${res.status}).`);
  return res.text();
}

const defaultIO: CaptureIO = { ocrImage: defaultOcrImage, fetchListingHtml: defaultFetchListingHtml };
let io: CaptureIO = defaultIO;

export function setVehicleCaptureIO(next: Partial<CaptureIO>) {
  io = { ...io, ...next };
}

export function resetVehicleCaptureIO() {
  io = defaultIO;
}

// Cascade: free structured data (JSON-LD) + regex first; escalate to AI only
// when those leave the car under-identified AND an AI backend is configured.
export async function captureVehicle(input: {
  source: "url" | "image" | "text";
  url?: string;
  imageBase64?: string;
  rawText?: string;
}): Promise<AIParsedListing> {
  const warnings: string[] = [];
  let text = "";
  let vehicle: VehicleDraft = {};
  let structuredIdentity = false;

  if (input.source === "text") {
    text = input.rawText ?? "";
  } else if (input.source === "image") {
    text = await io.ocrImage(input.imageBase64 ?? "");
  } else {
    const html = await io.fetchListingHtml(input.url ?? "");
    text = htmlToText(html);
    const structured = structuredVehicleFromHtml(html);
    if (hasAnyField(structured)) {
      vehicle = structured;
      structuredIdentity = Boolean(structured.make && structured.model);
    } else if (text.length < 200) {
      warnings.push("The listing page returned very little readable text (likely a JavaScript-only page). A screenshot usually works better.");
    }
    if (input.url) vehicle.listingUrl = vehicle.listingUrl ?? input.url;
  }

  if (!text.trim() && !hasAnyField(vehicle)) {
    throw new HttpError(422, "No readable text could be extracted from the input.");
  }

  // Free regex pass fills whatever structured data missed.
  vehicle = fillGaps(vehicle, heuristicVehicleFromText(text));

  let usedAI = false;
  if (!isSufficient(vehicle)) {
    const ai = await parseListingWithAI(text); // null when no AI backend is configured
    if (ai) {
      vehicle = fillGaps(vehicle, ai.vehicle);
      usedAI = true;
    }
  }

  if (input.source === "url" && input.url) vehicle.listingUrl = vehicle.listingUrl ?? input.url;

  if (!(vehicle.vin || vehicle.stockNumber)) warnings.push("No VIN or stock number detected — confirm this is the right unit.");
  if (!(vehicle.listedPrice || vehicle.msrp)) warnings.push("No listed price detected.");

  const confidence: AIParsedListing["confidence"] = structuredIdentity
    ? "high"
    : vehicle.vin || (vehicle.make && vehicle.model)
      ? "medium"
      : usedAI
        ? "medium"
        : "low";

  return { vehicle, confidence, warnings };
}
