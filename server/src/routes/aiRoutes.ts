import { Router } from "express";
import { z } from "zod";
import { captureVehicleSchema } from "@dealdesk/shared";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { AIExtraction } from "../models/AIExtraction";
import { Offer } from "../models/Offer";
import { generateReply, parseDealerMessage } from "../services/aiService";
import { captureVehicle } from "../services/vehicleCaptureService";
import { vehicleDescriptor } from "../services/outreachService";
import { HttpError } from "../utils/httpError";
import { CarSearch } from "../models/CarSearch";
import { SearchDealer } from "../models/SearchDealer";
import { Vehicle } from "../models/Vehicle";
import { assertObjectId } from "../utils/objectId";

const router = Router();
router.use("/ai", requireAuth);

async function assertSearch(userId: string, carSearchId: string) {
  assertObjectId(carSearchId, "carSearchId");
  const search = await CarSearch.findOne({ _id: carSearchId, userId });
  if (!search) throw new HttpError(404, "Car search not found");
}

async function assertDealerForSearch(userId: string, dealerId: string | undefined, carSearchId: string) {
  if (!dealerId) return;
  assertObjectId(dealerId, "dealerId");
  const dealer = await SearchDealer.findOne({ _id: dealerId, userId, carSearchId });
  if (!dealer) throw new HttpError(404, "Dealer not found for this search");
}

async function assertOfferForDealer(userId: string, offerId: string | undefined, carSearchId: string, dealerId: string) {
  if (!offerId) return;
  assertObjectId(offerId, "offerId");
  const offer = await Offer.findOne({ _id: offerId, userId, carSearchId, dealerId });
  if (!offer) throw new HttpError(404, "Offer not found for this dealer");
}

router.post("/ai/parse-dealer-message", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ carSearchId: z.string(), dealerId: z.string().optional(), rawText: z.string().min(1) }).parse(req.body);
    await assertSearch(req.user!.id, body.carSearchId);
    await assertDealerForSearch(req.user!.id, body.dealerId, body.carSearchId);
    const parsed = await parseDealerMessage(body.rawText);
    const extraction = await AIExtraction.create({
      userId: req.user!.id,
      carSearchId: body.carSearchId,
      dealerId: body.dealerId,
      inputType: "dealer_message",
      rawInput: body.rawText,
      extractedJson: parsed,
      confidence: parsed.confidence,
      redFlags: parsed.redFlags,
      missingInfo: parsed.missingInfo,
      suggestedNextStep: parsed.suggestedNextStep,
      suggestedReply: parsed.suggestedReply,
      userConfirmed: false
    });
    res.json({ extractionId: extraction.id, ...parsed });
  } catch (error) {
    next(error);
  }
});

router.post("/ai/capture-vehicle", async (req: AuthRequest, res, next) => {
  try {
    const body = captureVehicleSchema.parse(req.body);
    await assertSearch(req.user!.id, body.carSearchId);
    await assertDealerForSearch(req.user!.id, body.dealerId, body.carSearchId);
    const parsed = await captureVehicle({ source: body.source, url: body.url, imageBase64: body.imageBase64, rawText: body.rawText });
    const extraction = await AIExtraction.create({
      userId: req.user!.id,
      carSearchId: body.carSearchId,
      dealerId: body.dealerId,
      inputType: "listing",
      rawInput: body.source === "url" ? body.url : body.source === "text" ? body.rawText : "[screenshot]",
      extractedJson: { vehicle: parsed.vehicle },
      confidence: parsed.confidence,
      redFlags: [],
      missingInfo: [],
      suggestedNextStep: "Review the captured car details, then save.",
      userConfirmed: false
    });
    res.json({ extractionId: extraction.id, vehicle: parsed.vehicle, confidence: parsed.confidence, warnings: parsed.warnings });
  } catch (error) {
    next(error);
  }
});

router.post("/ai/summarize-call-note", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ carSearchId: z.string(), dealerId: z.string().optional(), rawText: z.string().min(1) }).parse(req.body);
    await assertSearch(req.user!.id, body.carSearchId);
    await assertDealerForSearch(req.user!.id, body.dealerId, body.carSearchId);
    const parsed = await parseDealerMessage(body.rawText);
    res.json({ summary: parsed.suggestedNextStep, ...parsed });
  } catch (error) {
    next(error);
  }
});

router.post("/ai/generate-reply", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ carSearchId: z.string(), dealerId: z.string(), offerId: z.string().optional(), vehicleId: z.string().optional(), userGoal: z.string().optional(), tone: z.enum(["friendly", "firm", "concise"]).optional() }).parse(req.body);
    await assertSearch(req.user!.id, body.carSearchId);
    await assertDealerForSearch(req.user!.id, body.dealerId, body.carSearchId);
    await assertOfferForDealer(req.user!.id, body.offerId, body.carSearchId, body.dealerId);

    // Anchor the reply to the requested car, or the dealer's focus car.
    const dealer = await SearchDealer.findOne({ _id: body.dealerId, userId: req.user!.id, carSearchId: body.carSearchId });
    const vehicleId = body.vehicleId ?? (dealer?.get("focusVehicleId") ? String(dealer.get("focusVehicleId")) : undefined);
    let vehicleLabel: string | undefined;
    if (vehicleId) {
      assertObjectId(vehicleId, "vehicleId");
      const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.user!.id, carSearchId: body.carSearchId });
      if (!vehicle) throw new HttpError(404, "Vehicle not found for this search");
      vehicleLabel = vehicleDescriptor(vehicle);
    }
    res.json(await generateReply({ tone: body.tone, userGoal: body.userGoal, vehicleLabel }));
  } catch (error) {
    next(error);
  }
});

router.post("/ai/analyze-offers", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ carSearchId: z.string() }).parse(req.body);
    await assertSearch(req.user!.id, body.carSearchId);
    const offers = await Offer.find({ userId: req.user!.id, carSearchId: body.carSearchId });
    const rankedOffers = offers
      .map((offer) => offer.toObject())
      .sort((a, b) => (a.otdPrice ?? Number.POSITIVE_INFINITY) - (b.otdPrice ?? Number.POSITIVE_INFINITY));
    res.json({
      bestOfferId: rankedOffers[0]?._id,
      summary: rankedOffers.length ? "Ranked by lowest itemized OTD price first." : "No offers yet.",
      rankedOffers,
      redFlags: rankedOffers.flatMap((offer) => offer.redFlags ?? []),
      nextActions: rankedOffers.length ? ["Ask finalists to beat the current best OTD price."] : ["Add or parse a dealer quote."]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
