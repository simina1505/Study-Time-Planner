import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Group from "../models/Group.js";
import Task from "../models/Task.js";

const router = express.Router();
dotenv.config();

router.post("/createTask", async (req, res) => {
  try {
    const { title, description, createdBy, groupId, deadline } = req.body;
    const newTask = await Task.create({
      title,
      description,
      creator: createdBy,
      groupId,
      deadline,
    });
    res.status(201).json({ success: true, newTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/getAllTasks/:groupId", async (req, res) => {
  try {
    const tasks = await Task.find({
      groupId: req.params.groupId,
      status: "pending",
    });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/claimTask/:taskId", async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { assignedTo: userId, status: "taken" },
      { new: true }
    );
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/getTaskByUserId/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    const tasks = await Task.find({ assignedTo: userId });

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    res.status(200).json({ success: true, tasks });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/completeTask/:taskId", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: "completed" },
      { new: true }
    );
    res.status(200).json({ success: true, updatedTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/deleteTask/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.query;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const group = await Group.findById(task.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (
      userId !== task.creator._id.toString() &&
      task.creator.toString() !== group.creator.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this task" });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/taskStatistics/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid group ID format" });
    }

    const tasks = await Task.aggregate([
      { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          tasks: { $push: "$$ROOT" },
        },
      },
    ]);

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching task statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/removeTask/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { assignedTo: null, status: "pending" },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ success: true, updatedTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/taskStatisticsForUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const tasks = await Task.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          tasks: { $push: "$$ROOT" },
        },
      },
    ]);
    res.json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching task statistics for user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
