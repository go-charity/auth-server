import { NextFunction, Request, Response } from "express";
import {
  OTPModelClass,
  addTimeToDate,
  convertFrombase64,
  generateRandom6digitString,
  getOTPEmailTemplate,
  sendmail,
  validateObjectProperties,
} from "../utils/utils";
import OTP from "../models/OTP";
import bcrypt from "bcrypt";
import UserModel from "../models/Users";

export const verifyOTP = async (
  req: Request<any, any, { email: string; otp: string }>,
  res: Response,
  next: NextFunction
) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["email", "otp"],
    strict: false,
    returnMissingKeys: true,
  });
  if (!result || (typeof result === "object" && !result.valid))
    return res
      .status(422)
      .json(
        `Invalid body passed. ${
          typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""
        }`
      );

  const token = await OTP.findOne<OTPModelClass>({ email: req.body.email });

  // Validate if the provided email address exists in the database
  if (!token) return res.status(400).json("Invalid OTP");
  // Validate if the token provided equals that in the database
  if (!(await bcrypt.compare(convertFrombase64(req.body.otp), token.token)))
    return res.status(400).json("Invalid OTP");
  // Validate if the token provided is expired
  if (new Date(token.expires_in) <= new Date())
    return res.status(400).json("Invalid OTP");

  // Delete the OTP from the database
  const deleteOTP = await OTP.deleteMany({ email: req.body.email });
  if (!deleteOTP) return res.status(500).json("Something went wrong");

  const mode = req.headers.mode;

  // If the mode is login, update the authenticated field in the database
  if (mode === "login") {
    await UserModel.updateOne(
      { email: req.body.email },
      { $set: { authenticated: true } }
    );

    return res
      .status(200)
      .json("User email address validated. Proceed to login");
  }
  // If the mode is change-password, generate a special token for the change password endpoint
  else if (mode === "change-password") {
    // Generate access_token for the change password endpoint
    return res.status(200).json({
      message: "User email address validated. Proceed to change password",
      access_token: "",
    });
  }

  return res
    .status(422)
    .json(
      "Please validate the parameters passed, especially the 'mode' header"
    );
};

export const createOTP = async (
  req: Request<any, any, { email: string }>,
  res: Response,
  next: NextFunction
) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["email"],
    strict: false,
    returnMissingKeys: true,
  });
  if (!result || (typeof result === "object" && !result.valid))
    return res
      .status(422)
      .json(
        `Invalid body passed. ${
          typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""
        }`
      );

  // Delete previous OTP with same email address
  const deletedOTP = await OTP.deleteMany({
    email: req.body.email,
  });

  if (!deletedOTP.acknowledged)
    return res.status(500).json("Something wrong occurred");

  const token = generateRandom6digitString();

  // Create a valid OTP token
  const otp = await OTP.create(
    new OTPModelClass(
      req.body.email,
      await bcrypt.hash(token, 10),
      addTimeToDate(undefined, 60 * 60)
    )
  );

  // Send the token to the right email address
  await sendmail({
    from: process.env.MAIL_ACCOUNT_EMAIL,
    to: req.body.email,
    subject: "Confirm your email address",
    html: getOTPEmailTemplate(token),
  });

  if (!otp) return res.status(500).json("Something wrong occurred");

  return res.status(201).json("OTP created successfully");
};
