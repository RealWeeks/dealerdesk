import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { DealerSeed } from "../models/DealerSeed";
import { discoverDealers } from "../services/dealerDiscoveryService";
import { haversineMiles } from "../utils/haversine";
import { zipCoordinates } from "../utils/zipCoordinates";
import { seedDealers } from "../utils/seedDealers";
import { HttpError } from "../utils/httpError";

const router = Router();

// Live dealer discovery (real dealerships + websites via OpenStreetMap), cached in
// our own DB. Authed since it can trigger outbound calls; it's behind login anyway.
router.get("/dealer-seeds/discover", requireAuth, async (req, res, next) => {
  try {
    const query = z
      .object({ brand: z.string().min(1), zip: z.string().min(5), radius: z.coerce.number().positive(), refresh: z.string().optional() })
      .parse(req.query);
    const result = await discoverDealers({ brand: query.brand, zip: query.zip, radiusMiles: query.radius, refresh: query.refresh === "true" });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/dealer-seeds/search", async (req, res, next) => {
  try {
    const query = z.object({ brand: z.string().min(1), zip: z.string().min(5), radius: z.coerce.number().positive() }).parse(req.query);
    const origin = zipCoordinates[query.zip];
    if (!origin) throw new HttpError(400, "Unsupported ZIP for local radius search");
    const brand = query.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dealers = await DealerSeed.find({ brand: new RegExp(`^${brand}$`, "i") });
    const withDistance = dealers
      .filter((dealer) => Number.isFinite(Number(dealer.get("latitude"))) && Number.isFinite(Number(dealer.get("longitude"))))
      .map((dealer) => {
        const distanceMiles = haversineMiles(origin, { latitude: Number(dealer.get("latitude")), longitude: Number(dealer.get("longitude")) });
        return { ...dealer.toObject(), distanceMiles: Math.round(distanceMiles * 10) / 10 };
      })
      .filter((dealer) => dealer.distanceMiles <= query.radius)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
    res.json(withDistance);
  } catch (error) {
    next(error);
  }
});

router.post("/dealer-seeds/seed-local-dev", async (_req, res, next) => {
  try {
    await seedDealers();
    res.status(201).json({ seeded: true });
  } catch (error) {
    next(error);
  }
});

export default router;
