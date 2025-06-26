import express from "express";
import User from "../models/User.js";
import admin from "firebase-admin";
import { transporter } from "./shared.js";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

router.patch("/updateUser", async (req, res) => {
  const { userId, username, email, firstName, lastName, city } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Username is already taken." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    user.city = city;

    if (user.email !== email) {
      try {
        let firebaseUser;

        try {
          firebaseUser = await admin.auth().getUserByEmail(email);
        } catch (err) {
          if (err.code === "auth/user-not-found") {
            firebaseUser = await admin.auth().createUser({ email });
          } else {
            throw err;
          }
        }

        const verifyLink = await admin
          .auth()
          .generateEmailVerificationLink(email);

        const mailOptions = {
          from: process.env.MAIL_USER,
          to: email,
          subject: "Verify Your New Email - Study Group Organizer",
          html: `<p>Click the link below to verify your new email address:</p>
                 <a href="${verifyLink}">${verifyLink}</a>`,
        };

        await transporter.sendMail(mailOptions);
      } catch (firebaseError) {
        console.error("Error sending verification email:", firebaseError);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email.",
        });
      }
    }

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User updated successfully.", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the user.",
    });
  }
});

router.get("/verifyEmail", async (req, res) => {
  const { userId, email } = req.query;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const firebaseUser = await admin.auth().getUserByEmail(email);

    if (!firebaseUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified in Firebase.",
      });
    }

    user.email = firebaseUser.email;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified and updated successfully in MongoDB.",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying the email.",
    });
  }
});

router.post("/checkUserExistence", async (req, res) => {
  const { field, value } = req.body;

  if (!["username", "email"].includes(field)) {
    return res
      .status(400)
      .send({ available: false, message: "Invalid field." });
  }

  const query = {};
  query[field] = value;

  try {
    const existingUser = await User.findOne(query);
    res.send({ available: !existingUser });
  } catch (error) {
    res
      .status(500)
      .send({ available: false, message: "Error checking user availability." });
  }
});

router.get("/getUsernameById/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    res.json({
      success: true,
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching username",
      error: error.message,
    });
  }
});

router.get("/getUser/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching username",
      error: error.message,
    });
  }
});

router.get("/getUserByUsername/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error("User not found");
    }

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching username",
      error: error.message,
    });
  }
});
export default router;
