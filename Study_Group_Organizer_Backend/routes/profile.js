import express from "express";
import dotenv from "dotenv";
import User from "../models/User.js";
import { upload } from "./shared.js";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();
dotenv.config();
router.post(
  "/uploadProfilePicture",
  upload.single("file"),
  async (req, res) => {
    const { userId } = req.body;
    const file = req.file;

    try {
      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: "File is required" });
      }

      const mediaUrl = file.path;
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (user.profilePicture) {
        const oldPublicId = user.profilePicture.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(oldPublicId);
      }

      user.profilePicture = mediaUrl;
      await user.save();

      res.status(201).json({
        success: true,
        message: "Profile picture uploaded successfully",
        profilePictureUri: mediaUrl,
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.get("/getImageByUserId/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user || !user.profilePicture) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json({ success: true, mediaUrl: user.profilePicture });
  } catch (error) {
    console.error("Error retrieving image:", error);
    res.status(500).json({ error: "Error retrieving image" });
  }
});
export default router;
