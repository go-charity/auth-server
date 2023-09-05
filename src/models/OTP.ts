import mongoose from "mongoose";

const otpModel = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expires_in: { type: Date, required: true },
});

const OTPModel = mongoose.model("OTP", otpModel);

export default mongoose.models.OTP || OTPModel;
