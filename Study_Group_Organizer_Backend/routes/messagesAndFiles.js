import express from "express";
import dotenv from "dotenv";
import File from "../models/Files.js";
import Message from "../models/Message.js";
import { upload } from "./shared.js";

const router = express.Router();
dotenv.config();

router.post("/sendMessage", async (req, res) => {
  const { senderId, groupId, content } = req.body;

  try {
    const message = await Message.create({
      senderId,
      groupId,
      content,
    });
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/sendFile", upload.single("file"), async (req, res) => {
  const { senderId, groupId } = req.body;
  const file = req.file;
  try {
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    const mediaUrl = file.path;

    const fileMessage = await File.create({
      senderId,
      groupId,
      fileName: file.originalname,
      mediaUrl: mediaUrl,
    });

    res.status(201).json({ success: true, fileMessage });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/fetchMessagesandFiles/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    const textMessages = await Message.find({ groupId }).lean();

    const fileMessages = await File.find({ groupId }).lean();

    const formattedTextMessages = textMessages.map((msg) => ({
      _id: msg._id,
      text: msg.content,
      timestamp: msg.timestamp,
      user: { _id: msg.senderId },
      file: null,
    }));

    const formattedFileMessages = fileMessages.map((file) => ({
      _id: file._id,
      text: `File: ${file.fileName}`,
      timestamp: file.timestamp,
      user: { _id: file.senderId },
      file: { url: file.mediaUrl, name: file.fileName },
    }));

    const allMessages = [
      ...formattedTextMessages,
      ...formattedFileMessages,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      messages: allMessages,
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/getImageByName/:fileName", async (req, res) => {
  const { fileName } = req.params;

  try {
    const file = await File.findOne({ fileName });

    if (!file) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.json({ success: true, mediaUrl: file.mediaUrl });
  } catch (error) {
    console.error("Error retrieving image:", error);
    res.status(500).json({ error: "Error retrieving image" });
  }
});
export default router;
