import mongoose from "mongoose";
import { HttpError } from "./httpError";

export function assertObjectId(id: string, label = "id") {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return id;
}
