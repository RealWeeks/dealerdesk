import { Router } from "express";
import { addDealerSchema, interactionSchema, offerSchema, searchDealerPatchSchema, taskSchema, vehicleSchema } from "@dealdesk/shared";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { AIExtraction } from "../models/AIExtraction";
import { CarSearch } from "../models/CarSearch";
import { DealerSeed } from "../models/DealerSeed";
import { Interaction } from "../models/Interaction";
import { Offer } from "../models/Offer";
import { SearchDealer } from "../models/SearchDealer";
import { Task } from "../models/Task";
import { Vehicle } from "../models/Vehicle";
import { haversineMiles } from "../utils/haversine";
import { zipCoordinates } from "../utils/zipCoordinates";
import { HttpError } from "../utils/httpError";
import { assertObjectId } from "../utils/objectId";

const router = Router();
router.use(["/car-searches", "/dealers", "/vehicles", "/offers", "/tasks", "/ai-extractions"], requireAuth);
const offerPatchSchema = offerSchema.partial().omit({ dealerId: true, vehicleId: true });
const taskPatchSchema = taskSchema.partial();
const vehiclePatchSchema = vehicleSchema.partial();

async function requireSearch(userId: string, carSearchId: string) {
  assertObjectId(carSearchId, "carSearchId");
  const search = await CarSearch.findOne({ _id: carSearchId, userId });
  if (!search) throw new HttpError(404, "Car search not found");
  return search;
}

async function requireDealer(userId: string, dealerId: string) {
  assertObjectId(dealerId, "dealerId");
  const dealer = await SearchDealer.findOne({ _id: dealerId, userId });
  if (!dealer) throw new HttpError(404, "Dealer not found");
  return dealer;
}

async function requireDealerForSearch(userId: string, dealerId: string, carSearchId: string) {
  assertObjectId(dealerId, "dealerId");
  const dealer = await SearchDealer.findOne({ _id: dealerId, userId, carSearchId });
  if (!dealer) throw new HttpError(404, "Dealer not found for this search");
  return dealer;
}

async function requireVehicleForSearch(userId: string, vehicleId: string, carSearchId: string) {
  assertObjectId(vehicleId, "vehicleId");
  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId, carSearchId });
  if (!vehicle) throw new HttpError(404, "Vehicle not found for this search");
  return vehicle;
}

router.post("/car-searches/:carSearchId/dealers", async (req: AuthRequest, res, next) => {
  try {
    const search = await requireSearch(req.user!.id, req.params.carSearchId);
    const body = addDealerSchema.parse(req.body);
    assertObjectId(body.dealerSeedId, "dealerSeedId");
    const seed = await DealerSeed.findById(body.dealerSeedId);
    if (!seed) throw new HttpError(404, "Dealer seed not found");
    const existing = await SearchDealer.findOne({ userId: req.user!.id, carSearchId: search.id, dealerSeedId: seed.id });
    if (existing) throw new HttpError(409, "Dealer is already added to this search");
    const origin = zipCoordinates[String(search.get("zipCode"))];
    const distanceMiles = origin ? haversineMiles(origin, { latitude: Number(seed.get("latitude")), longitude: Number(seed.get("longitude")) }) : undefined;
    const dealer = await SearchDealer.create({
      userId: req.user!.id,
      carSearchId: search.id,
      dealerSeedId: seed.id,
      name: seed.get("name"),
      brand: seed.get("brand"),
      city: seed.get("city"),
      state: seed.get("state"),
      phone: seed.get("phone"),
      websiteUrl: seed.get("websiteUrl"),
      inventoryUrl: seed.get("inventoryUrl"),
      distanceMiles,
      priority: body.priority,
      notes: body.notes
    });
    res.status(201).json(dealer);
  } catch (error) {
    next(error);
  }
});

router.get("/car-searches/:carSearchId/dealers", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    res.json(await SearchDealer.find({ userId: req.user!.id, carSearchId: req.params.carSearchId }).sort({ priority: 1, createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.get("/dealers/:id", async (req: AuthRequest, res, next) => {
  try {
    res.json(await requireDealer(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});

router.patch("/dealers/:id", async (req: AuthRequest, res, next) => {
  try {
    const doc = await SearchDealer.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, searchDealerPatchSchema.parse(req.body), { new: true });
    if (!doc) throw new HttpError(404, "Dealer not found");
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/dealers/:id", async (req: AuthRequest, res, next) => {
  const doc = await SearchDealer.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Dealer not found"));
  res.status(204).end();
});

router.post("/car-searches/:carSearchId/vehicles", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    const body = vehicleSchema.parse(req.body);
    if (body.dealerId) await requireDealerForSearch(req.user!.id, body.dealerId, req.params.carSearchId);
    res.status(201).json(await Vehicle.create({ ...body, userId: req.user!.id, carSearchId: req.params.carSearchId }));
  } catch (error) {
    next(error);
  }
});

router.get("/car-searches/:carSearchId/vehicles", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    res.json(await Vehicle.find({ userId: req.user!.id, carSearchId: req.params.carSearchId }));
  } catch (error) {
    next(error);
  }
});

router.patch("/vehicles/:id", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "vehicleId");
    const update = vehiclePatchSchema.parse(req.body);
    if (update.dealerId) await requireDealer(req.user!.id, update.dealerId);
    const doc = await Vehicle.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, update, { new: true });
    if (!doc) return next(new HttpError(404, "Vehicle not found"));
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/vehicles/:id", async (req: AuthRequest, res, next) => {
  assertObjectId(req.params.id, "vehicleId");
  const doc = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Vehicle not found"));
  res.status(204).end();
});

router.post("/car-searches/:carSearchId/offers", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    const body = offerSchema.parse(req.body);
    await requireDealerForSearch(req.user!.id, body.dealerId, req.params.carSearchId);
    if (body.vehicleId) await requireVehicleForSearch(req.user!.id, body.vehicleId, req.params.carSearchId);
    res.status(201).json(await Offer.create({ ...body, userId: req.user!.id, carSearchId: req.params.carSearchId }));
  } catch (error) {
    next(error);
  }
});

router.get("/car-searches/:carSearchId/offers", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    const offers = await Offer.find({ userId: req.user!.id, carSearchId: req.params.carSearchId });
    offers.sort((a, b) => (a.get("otdPrice") ?? Number.POSITIVE_INFINITY) - (b.get("otdPrice") ?? Number.POSITIVE_INFINITY));
    res.json(offers);
  } catch (error) {
    next(error);
  }
});

router.get("/offers/:id", async (req: AuthRequest, res, next) => {
  assertObjectId(req.params.id, "offerId");
  const doc = await Offer.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Offer not found"));
  res.json(doc);
});

router.patch("/offers/:id", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "offerId");
    const doc = await Offer.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, offerPatchSchema.parse(req.body), { new: true });
    if (!doc) return next(new HttpError(404, "Offer not found"));
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/offers/:id", async (req: AuthRequest, res, next) => {
  assertObjectId(req.params.id, "offerId");
  const doc = await Offer.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Offer not found"));
  res.status(204).end();
});

router.post("/car-searches/:carSearchId/interactions", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    const body = interactionSchema.parse(req.body);
    if (body.dealerId) await requireDealerForSearch(req.user!.id, body.dealerId, req.params.carSearchId);
    if (body.vehicleId) await requireVehicleForSearch(req.user!.id, body.vehicleId, req.params.carSearchId);
    if (body.offerId) {
      assertObjectId(body.offerId, "offerId");
      const offer = await Offer.findOne({ _id: body.offerId, userId: req.user!.id, carSearchId: req.params.carSearchId });
      if (!offer) throw new HttpError(404, "Offer not found for this search");
    }
    res.status(201).json(await Interaction.create({ ...body, userId: req.user!.id, carSearchId: req.params.carSearchId }));
  } catch (error) {
    next(error);
  }
});

router.get("/car-searches/:carSearchId/interactions", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    res.json(await Interaction.find({ userId: req.user!.id, carSearchId: req.params.carSearchId }).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.get("/dealers/:dealerId/interactions", async (req: AuthRequest, res, next) => {
  try {
    await requireDealer(req.user!.id, req.params.dealerId);
    res.json(await Interaction.find({ userId: req.user!.id, dealerId: req.params.dealerId }).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/car-searches/:carSearchId/tasks", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    const body = taskSchema.parse(req.body);
    if (body.dealerId) await requireDealerForSearch(req.user!.id, body.dealerId, req.params.carSearchId);
    res.status(201).json(await Task.create({ ...body, userId: req.user!.id, carSearchId: req.params.carSearchId }));
  } catch (error) {
    next(error);
  }
});

router.get("/car-searches/:carSearchId/tasks", async (req: AuthRequest, res, next) => {
  try {
    await requireSearch(req.user!.id, req.params.carSearchId);
    res.json(await Task.find({ userId: req.user!.id, carSearchId: req.params.carSearchId }).sort({ dueAt: 1 }));
  } catch (error) {
    next(error);
  }
});

router.patch("/tasks/:id", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "taskId");
    const parsed = taskPatchSchema.parse(req.body);
    if (parsed.dealerId) await requireDealer(req.user!.id, parsed.dealerId);
    const update = { ...parsed, completedAt: parsed.status === "done" ? new Date() : undefined };
    const doc = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, update, { new: true });
    if (!doc) return next(new HttpError(404, "Task not found"));
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/tasks/:id", async (req: AuthRequest, res, next) => {
  assertObjectId(req.params.id, "taskId");
  const doc = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Task not found"));
  res.status(204).end();
});

router.post("/ai-extractions/:id/confirm", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "aiExtractionId");
    const extraction = await AIExtraction.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!extraction) throw new HttpError(404, "AI extraction not found");
    if (extraction.get("userConfirmed")) throw new HttpError(409, "AI extraction is already confirmed");
    const carSearchId = String(extraction.get("carSearchId"));
    await requireSearch(req.user!.id, carSearchId);
    const dealerId = extraction.get("dealerId") ? String(extraction.get("dealerId")) : undefined;
    if (dealerId) await requireDealerForSearch(req.user!.id, dealerId, carSearchId);
    extraction.set("userConfirmed", true);
    await extraction.save();
    const extracted = extraction.get("extractedJson");

    // Listing captures become a Vehicle attached to the dealer, and seed the
    // dealer's focus car when none is set yet. The review screen may send edited
    // fields in req.body.vehicle, which win over the raw extraction.
    if (extraction.get("inputType") === "listing") {
      const draft = (extracted?.vehicle ?? {}) as Record<string, unknown>;
      const edits = req.body?.vehicle ? vehiclePatchSchema.parse(req.body.vehicle) : {};
      const vehicle = await Vehicle.create({ ...draft, ...edits, userId: req.user!.id, carSearchId, dealerId });
      if (dealerId) {
        const dealer = await SearchDealer.findOne({ _id: dealerId, userId: req.user!.id });
        if (dealer && !dealer.get("focusVehicleId")) {
          dealer.set("focusVehicleId", vehicle._id);
          await dealer.save();
        }
      }
      return res.json({ extraction, vehicle });
    }

    // Link the quote + inbound message to the dealer's focus car when set.
    const dealerFocus = dealerId ? await SearchDealer.findOne({ _id: dealerId, userId: req.user!.id }) : null;
    const focusVehicleId = dealerFocus?.get("focusVehicleId") ?? undefined;

    let offer = null;
    let interaction = null;
    if (extracted?.offer && dealerId) {
      offer = await Offer.create({
        ...extracted.offer,
        userId: req.user!.id,
        carSearchId,
        dealerId,
        vehicleId: focusVehicleId,
        redFlags: extraction.get("redFlags"),
        missingInfo: extraction.get("missingInfo"),
        sourceType: "paste",
        sourceText: extraction.get("rawInput"),
        confidence: extraction.get("confidence")
      });
    }
    if (dealerId) {
      interaction = await Interaction.create({
        userId: req.user!.id,
        carSearchId,
        dealerId,
        offerId: offer?.id,
        vehicleId: focusVehicleId,
        type: "email",
        direction: "inbound",
        rawContent: extraction.get("rawInput"),
        aiSummary: extraction.get("suggestedNextStep"),
        aiSuggestedNextStep: extraction.get("suggestedNextStep")
      });
    }
    res.json({ extraction, offer, interaction });
  } catch (error) {
    next(error);
  }
});

export default router;
