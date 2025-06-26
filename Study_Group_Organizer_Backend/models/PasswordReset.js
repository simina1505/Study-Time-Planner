import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const PasswordReset = mongoose.model("PasswordReset", PasswordResetSchema);
export default PasswordReset;
