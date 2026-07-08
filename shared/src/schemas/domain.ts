import { z } from "zod";
import {
  carSearchStatuses,
  dealerStatuses,
  financingStrategies,
  priorities,
  quoteCompleteness,
  tradeInStrategies
} from "../constants/statuses.js";

export const carSearchSchema = z.object({
  year: z.coerce.number().int().min(1900),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().min(1),
  zipCode: z.string().min(5),
  searchRadiusMiles: z.coerce.number().positive(),
  targetSellingPrice: z.coerce.number().optional(),
  targetOtdPrice: z.coerce.number().optional(),
  willingToTravel: z.boolean().default(true),
  willingToShip: z.boolean().default(false),
  tradeInStrategy: z.enum(tradeInStrategies).default("separate"),
  financingStrategy: z.enum(financingStrategies).default("separate"),
  status: z.enum(carSearchStatuses).default("active")
});

export const addDealerSchema = z.object({
  dealerSeedId: z.string().min(1),
  priority: z.enum(priorities).default("medium"),
  notes: z.string().optional()
});

export const idParamSchema = z.object({ id: z.string().min(1) });
export const carSearchIdParamSchema = z.object({ carSearchId: z.string().min(1) });
export const dealerIdParamSchema = z.object({ dealerId: z.string().min(1) });

export const searchDealerPatchSchema = z.object({
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  status: z.enum(dealerStatuses).optional(),
  priority: z.enum(priorities).optional(),
  notes: z.string().optional(),
  focusVehicleId: z.string().optional(),
  lastContactedAt: z.coerce.date().optional(),
  nextFollowUpAt: z.coerce.date().optional()
});

export const vehicleSchema = z.object({
  dealerId: z.string().optional(),
  year: z.coerce.number().int(),
  make: z.string(),
  model: z.string(),
  trim: z.string(),
  vin: z.string().optional(),
  stockNumber: z.string().optional(),
  msrp: z.coerce.number().optional(),
  listedPrice: z.coerce.number().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  packages: z.array(z.string()).default([]),
  listingUrl: z.string().url().optional(),
  status: z.enum(["interested", "contacted", "quoted", "rejected", "finalist", "purchased"]).default("interested")
});

export const offerSchema = z.object({
  dealerId: z.string().min(1),
  vehicleId: z.string().optional(),
  msrp: z.coerce.number().optional(),
  sellingPrice: z.coerce.number().optional(),
  dealerDiscount: z.coerce.number().optional(),
  incentives: z.coerce.number().optional(),
  docFee: z.coerce.number().optional(),
  tax: z.coerce.number().optional(),
  titleRegistration: z.coerce.number().optional(),
  deliveryFee: z.coerce.number().optional(),
  addOns: z.array(z.object({ name: z.string(), amount: z.coerce.number().optional(), required: z.boolean().optional() })).default([]),
  tradeAllowance: z.coerce.number().optional(),
  payoff: z.coerce.number().optional(),
  apr: z.coerce.number().optional(),
  termMonths: z.coerce.number().optional(),
  monthlyPayment: z.coerce.number().optional(),
  downPayment: z.coerce.number().optional(),
  otdPrice: z.coerce.number().optional(),
  quoteCompleteness: z.enum(quoteCompleteness).default("partial"),
  redFlags: z.array(z.string()).default([]),
  missingInfo: z.array(z.string()).default([]),
  sourceType: z.enum(["manual", "paste", "screenshot", "dictation"]).default("manual"),
  sourceText: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]).default("medium")
});
export const offerPatchSchema = offerSchema.partial().omit({ dealerId: true, vehicleId: true });

export const interactionSchema = z.object({
  dealerId: z.string().optional(),
  vehicleId: z.string().optional(),
  offerId: z.string().optional(),
  type: z.enum(["email", "text", "phone", "in_person", "note"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  rawContent: z.string().min(1),
  aiSummary: z.string().optional(),
  aiSuggestedNextStep: z.string().optional()
});

export const taskSchema = z.object({
  dealerId: z.string().optional(),
  title: z.string().min(1),
  dueAt: z.coerce.date().optional(),
  status: z.enum(["open", "done"]).default("open")
});
export const taskPatchSchema = taskSchema.partial();
export const vehiclePatchSchema = vehicleSchema.partial();

export const initialOutreachMessageSchema = z.object({
  carSearchId: z.string().min(1),
  dealerId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  templateId: z.string().min(1).optional(),
  tone: z.enum(["friendly", "firm", "concise"]).default("friendly")
});

export const markOutreachContactedSchema = z.object({
  carSearchId: z.string().min(1),
  dealerIds: z.array(z.string().min(1)).min(1),
  vehicleId: z.string().min(1).optional(),
  messageText: z.string().min(1),
  templateId: z.string().min(1).optional(),
  createFollowUp: z.boolean().default(true),
  followUpDueAt: z.coerce.date().optional()
});

export const captureVehicleSchema = z.object({
  carSearchId: z.string().min(1),
  dealerId: z.string().min(1),
  source: z.enum(["url", "image", "text"]),
  url: z.string().url().optional(),
  imageBase64: z.string().min(1).optional(),
  rawText: z.string().min(1).optional()
}).refine(
  (value) =>
    (value.source === "url" && !!value.url) ||
    (value.source === "image" && !!value.imageBase64) ||
    (value.source === "text" && !!value.rawText),
  { message: "Provide the field matching the selected source (url, imageBase64, or rawText)." }
);

export const messageTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["initial_outreach", "follow_up", "otd_request", "add_on_removal", "beat_offer", "final_offer", "polite_decline"]),
  tone: z.enum(["casual", "friendly", "firm", "concise"]),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const messageTemplatePatchSchema = messageTemplateSchema.partial();
