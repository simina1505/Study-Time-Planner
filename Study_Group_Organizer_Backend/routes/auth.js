import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { transporter } from "./shared.js";
import User from "../models/User.js";
import PasswordReset from "../models/PasswordReset.js";

const router = express.Router();
dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

router.post("/signUp", async (req, res) => {
  const { username, email, password, firstName, lastName, city } = req.body;

  const oldUser = await User.findOne(
    { email: email } || { username: username }
  );

  if (oldUser) {
    return res.send({ data: "User already exists!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const firebaseUser = await admin.auth().createUser({
    email,
    password,
  });
  const verifyLink = await admin.auth().generateEmailVerificationLink(email);

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Verify Your Email - Study Time Planner",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verifyLink}">${verifyLink}</a>`,
  };

  await transporter.sendMail(mailOptions);

  try {
    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      city: city,
    });

    res.status(201).json({
      status: 201,
      success: true,
      message: "User created successfully!",
    });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

router.post("/signIn", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.send({ status: "error", data: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.send({
        status: "error",
        data: "Incorrect password. Try again.",
      });
    }

    const firebaseUser = await getAuth().getUserByEmail(email);

    if (!firebaseUser.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified! Please check your inbox.",
      });
    }

    res.json({
      success: true,
      message: "User logged in successfully!",
      username: user.username,
      userId: user._id,
    });
  } catch (error) {
    res.send({ status: "error", data: error.message });
  }
});

router.post("/sendResetCode", async (req, res) => {
  const { email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await PasswordReset.deleteMany({ email });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await PasswordReset.create({ email, code, expiresAt });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Password Reset Code",
    html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
  });

  res.json({ success: true });
});

router.post("/resetPassword", async (req, res) => {
  const { email, code, newPassword } = req.body;

  const record = await PasswordReset.findOne({ email, code });

  if (!record) {
    return res.status(400).json({ success: false, message: "Invalid code." });
  }

  if (new Date() > record.expiresAt) {
    await PasswordReset.deleteOne({ _id: record._id });
    return res.status(400).json({ success: false, message: "Code expired." });
  }

  const firebaseUser = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(firebaseUser.uid, { password: newPassword });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email }, { password: hashedPassword });

  await PasswordReset.deleteOne({ _id: record._id });

  res.json({ success: true, message: "Password updated successfully." });
});

export default router;
