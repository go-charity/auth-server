import mongoose from "mongoose";

const userModel = new mongoose.Schema({
  user_type: {
    type: String,
    enum: {
      values: ["donor", "orphanage"],
    },
    required: true,
  },
  government_ID: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  authenticated: {
    type: Boolean,
    required: true,
  },
});

const UserModel = mongoose.model("Users", userModel);

export default mongoose.models.Users || UserModel;
