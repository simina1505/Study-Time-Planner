import express from "express";
import dotenv from "dotenv";
import Session from "../models/Session.js";
import User from "../models/User.js";

const router = express.Router();
dotenv.config();

router.post("/createSession", async (req, res) => {
  const { name, startDate, endDate, startTime, endTime, groupId, acceptedBy } =
    req.body;

  try {
    const getTimestamp = (date, time) => {
      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : date;
      const [hour, minute] = time.split(":");
      const [year, month, day] = dateStr.split("-");

      const dateTime = new Date(year, month - 1, day, hour, minute);
      return dateTime.getTime();
    };

    const newStartTimestamp = getTimestamp(startDate, startTime);
    const newEndTimestamp = getTimestamp(endDate, endTime);

    if (isNaN(newStartTimestamp) || isNaN(newEndTimestamp)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid start or end date/time." });
    }

    const sessions = await Session.find({ groupId });

    const isValid = sessions.every((session) => {
      const sessionStartTimestamp = getTimestamp(
        session.startDate,
        session.startTime
      );
      const sessionEndTimestamp = getTimestamp(
        session.endDate,
        session.endTime
      );

      return (
        newEndTimestamp <= sessionStartTimestamp ||
        newStartTimestamp >= sessionEndTimestamp
      );
    });

    if (!isValid) {
      return res.json({
        success: false,
        message: "The session overlaps with an existing session.",
      });
    }
    let acceptedByIds = [];
    if (acceptedBy && acceptedBy.length > 0) {
      const users = await User.find({ username: { $in: acceptedBy } });
      acceptedByIds = users.map((user) => user._id);
    }

    const newSession = await Session.create({
      name: name,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      groupId: groupId,
      acceptedBy: acceptedByIds,
    });

    const populatedSession = await Session.findById(newSession._id).populate(
      "acceptedBy",
      "username"
    );

    const formattedSession = {
      ...populatedSession.toObject(),
      acceptedBy: populatedSession.acceptedBy.map((user) => user.username),
    };

    res.status(201).json({
      success: true,
      message: "Session created successfully!",
      session: formattedSession,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({
      success: false,
      message: "Error creating session.",
      error: error.message,
    });
  }
});

router.post("/editSession/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { name, startDate, endDate, startTime, endTime, groupId, acceptedBy } =
    req.body;
  try {
    const getTimestamp = (date, time) => {
      const dateStr =
        date instanceof Date ? date.toISOString().split("T")[0] : date;
      const [hour, minute] = time.split(":");
      const [year, month, day] = dateStr.split("-");

      const dateTime = new Date(year, month - 1, day, hour, minute);
      return dateTime.getTime();
    };

    const newStartTimestamp = getTimestamp(startDate, startTime);
    const newEndTimestamp = getTimestamp(endDate, endTime);

    if (isNaN(newStartTimestamp) || isNaN(newEndTimestamp)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid start or end date/time." });
    }

    const sessions = await Session.find({ groupId, _id: { $ne: sessionId } });

    const isValid = sessions.every((session) => {
      const sessionStartTimestamp = getTimestamp(
        session.startDate,
        session.startTime
      );
      const sessionEndTimestamp = getTimestamp(
        session.endDate,
        session.endTime
      );

      return (
        newEndTimestamp <= sessionStartTimestamp ||
        newStartTimestamp >= sessionEndTimestamp
      );
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "The session overlaps with an existing session.",
      });
    }

    let acceptedByIds = [];
    if (acceptedBy && acceptedBy.length > 0) {
      const users = await User.find({ username: { $in: acceptedBy } });
      acceptedByIds = users.map((user) => user._id);
    }

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      {
        name: name,
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        groupId: groupId,
        acceptedBy: acceptedByIds,
      },
      { new: true }
    ).populate("acceptedBy", "username");

    if (!updatedSession) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    const formattedSession = {
      ...updatedSession.toObject(),
      acceptedBy: updatedSession.acceptedBy.map((user) => user.username),
    };

    res.status(200).json({
      success: true,
      message: "Session updated successfully!",
      session: formattedSession,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({
      success: false,
      message: "Error updating session.",
      error: error.message,
    });
  }
});

router.get("/fetchUserSessions/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const sessions = await Session.find({
      acceptedBy: user._id,
    }).populate("acceptedBy", "username");

    const formattedSessions = sessions.map((session) => ({
      ...session.toObject(),
      acceptedBy: session.acceptedBy.map((user) => user.username),
    }));

    res.json({
      success: true,
      sessions: formattedSessions || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user sessions",
      error: error.message,
    });
  }
});

router.get("/fetchSessions/:groupId", async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const sessions = await Session.find({
      groupId: groupId,
    }).populate("acceptedBy", "username");

    const formattedSessions = sessions.map((session) => ({
      ...session.toObject(),
      acceptedBy: session.acceptedBy.map((user) => user.username),
    }));

    res.json({
      success: true,
      sessions: formattedSessions || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching group sessions",
      error: error.message,
    });
  }
});

router.get("/fetchSession/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const session = await Session.findById(sessionId).populate(
      "acceptedBy",
      "username"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const formattedSession = {
      ...session.toObject(),
      acceptedBy: session.acceptedBy.map((user) => user.username),
    };

    res.json({
      success: true,
      session: formattedSession,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching group sessions",
      error: error.message,
    });
  }
});

router.delete("/deleteSession/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  try {
    await Session.findByIdAndDelete(sessionId);
    res.json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete session" });
  }
});

router.post("/leaveSession/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { $pull: { acceptedBy: user._id } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({ success: true, message: "You have left the session" });
  } catch (error) {
    console.error("Error leaving session:", error);
    res.status(500).json({ success: false, message: "Error leaving session" });
  }
});

router.post("/rejoinSession/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const isAlreadyAccepted = session.acceptedBy.some(
      (id) => id.toString() === user._id.toString()
    );

    if (isAlreadyAccepted) {
      return res.status(400).json({
        success: false,
        message: "User is already part of this session",
      });
    }

    session.acceptedBy.push(user._id);
    await session.save();

    res.json({ success: true, message: "You have rejoined the session" });
  } catch (error) {
    console.error("Error rejoining session:", error);
    res
      .status(500)
      .json({ success: false, message: "Error rejoining session" });
  }
});
export default router;
