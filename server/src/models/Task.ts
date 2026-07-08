import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    carSearchId: { type: Schema.Types.ObjectId, ref: "CarSearch", required: true, index: true },
    dealerId: { type: Schema.Types.ObjectId, ref: "SearchDealer" },
    title: String,
    dueAt: Date,
    status: { type: String, enum: ["open", "done"], default: "open" },
    completedAt: Date
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
