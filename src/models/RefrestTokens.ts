import mongoose from "mongoose";

const refreshTokenModel = new mongoose.Schema({
  id: { type: String, required: true },
  user_ID: { type: String, required: true },
  expires_in: { type: Date, requred: true },
  valid_days: { type: Number, required: true },
  user_role: { type: String, required: true },
});

const RefreshTokenModel = mongoose.model("RefreshTokens", refreshTokenModel);

export default mongoose.models.RefreshTokens || RefreshTokenModel;
