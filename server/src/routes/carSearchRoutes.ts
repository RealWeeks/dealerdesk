import { Router } from "express";
import { carSearchSchema } from "@dealdesk/shared";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { CarSearch } from "../models/CarSearch";
import { HttpError } from "../utils/httpError";
import { assertObjectId } from "../utils/objectId";

const router = Router();
router.use("/car-searches", requireAuth);

router.post("/car-searches", async (req: AuthRequest, res, next) => {
  try {
    res.status(201).json(await CarSearch.create({ ...carSearchSchema.parse(req.body), userId: req.user!.id }));
  } catch (error) {
    next(error);
  }
});

router.get("/car-searches", async (req: AuthRequest, res) => {
  res.json(await CarSearch.find({ userId: req.user!.id }).sort({ createdAt: -1 }));
});

router.get("/car-searches/active", async (req: AuthRequest, res) => {
  res.json(await CarSearch.findOne({ userId: req.user!.id, status: "active" }).sort({ createdAt: -1 }));
});

router.get("/car-searches/:id", async (req: AuthRequest, res, next) => {
  assertObjectId(req.params.id, "carSearchId");
  const doc = await CarSearch.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Car search not found"));
  res.json(doc);
});

router.patch("/car-searches/:id", async (req: AuthRequest, res, next) => {
  try {
    assertObjectId(req.params.id, "carSearchId");
    const doc = await CarSearch.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, carSearchSchema.partial().parse(req.body), { new: true });
    if (!doc) return next(new HttpError(404, "Car search not found"));
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/car-searches/:id", async (req: AuthRequest, res, next) => {
  assertObjectId(req.params.id, "carSearchId");
  const doc = await CarSearch.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!doc) return next(new HttpError(404, "Car search not found"));
  res.status(204).end();
});

export default router;
