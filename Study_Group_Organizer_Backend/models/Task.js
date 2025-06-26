import mongoose from "mongoose";
const TaskSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Groups",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "taken", "completed"],
      default: "pending",
    },
    deadline: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "Tasks",
  }
);
const Task = mongoose.model("Tasks", TaskSchema);
export default Task;
