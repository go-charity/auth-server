import mongoose from "mongoose";

const tempUserDetailsModel = new mongoose.Schema({
  user_type: {
    type: String,
    enum: {
      values: ["donor", "orphanage"],
    },
    required: true,
  },
  user_ID: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  tagline: {
    type: String,
  },
  phone_number: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

const TempUserDetailsModel = mongoose.model(
  "temp_user_details",
  tempUserDetailsModel
);

export default TempUserDetailsModel;
