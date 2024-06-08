import { NextFunction, Request, Response } from "express";
import {
  OTPModelClass,
  addTimeToDate,
  convertFrombase64,
  convertTobase64,
  generateRandom6digitString,
  generateTokens,
  getOTPEmailTemplate,
  sendmail,
  setAccountTokens,
  validateObjectProperties,
} from "../utils/utils";
import OTP from "../models/OTP";
import bcrypt from "bcrypt";
import UserModel from "../models/Users";
import TempUserDetailsModel from "../models/TempUserDetails";
import jwt from "jsonwebtoken";
import accountAPIInstance from "../utils/instances";
import { TokenObjType } from "../types";

export const verifyOTP = async (
  req: Request<any, any, { email: string; otp: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
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

    // TODO: Increment the number of retries (i.e: No of times a request have been made to validate the OTP)

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

    const reqToken =
      req.cookies.otp_access_token ||
      req.headers.authorization?.split(" ")?.[1] ||
      "";

    const mode = (jwt.decode(reqToken) as { mode: string })?.mode;

    // If the mode is login
    if (mode === "login") {
      // Update the authenticated field in the database
      await UserModel.updateOne(
        { email: req.body.email },
        { $set: { authenticated: true } }
      );

      // * Get user details and generate tokens for accessing the user account dashboard
      // Get the user details from the user_details collection
      const userDetails = await UserModel.findOne({
        email: req.body.email,
      }).catch((e) => {
        throw new Error(e.message || e);
      });

      if (!userDetails) {
        throw new Error(
          `Could not find user with email address: ${req.body.email}`
        );
      }

      // Generate the access and refresh tokens for accessing the user's account dashboard
      const tokens = await generateTokens({
        user_ID: userDetails._id.toString(),
        user_role: userDetails.user_type,
      });

      // * Transfer user details from the temp_user_details collection to the account database (orphanage table)
      // Get user details from the temp_user_details collection
      const tempUserDetails = await TempUserDetailsModel.findOne({
        email: req.body.email,
      }).catch((e) => {
        throw new Error(e.message || e);
      });
      if (!tempUserDetails) {
        throw new Error(
          `Could not retrieve user account details from the temp_user_details`
        );
      }
      // Send user details to the edit orphanage account endpoint
      const updateAccountDetailsResponse = await accountAPIInstance
        .patch(
          "/v1/edit/details",
          {
            fullname: tempUserDetails.fullname,
            tagline: tempUserDetails.tagline,
            phone_number: tempUserDetails.phone_number,
          },
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
              ["Refresh-token"]: tokens.refreshToken,
            },
          }
        )
        .catch((e: any) => {
          throw new Error(
            `Could not update user account details (here): ${e?.message || e}`
          );
        });

      if (![200, 201].includes(updateAccountDetailsResponse.status)) {
        throw new Error(`Could not update user account details`);
      }

      // Set the  access and refresh tokens as cookies
      await setAccountTokens(res, tokens);

      return res.status(200).json({
        message: "User email validated",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user_id: convertTobase64(userDetails._id.toString() || "undefined"),
      });
    }
    // If the mode is change-password, generate a special token for the change password endpoint
    else if (mode === "change-password") {
      // TODO: Generate access_token for the change password endpoint
      return res.status(200).json({
        message: "User email address validated. Proceed to change password",
        access_token: "",
      });
    }

    return res
      .status(422)
      .json(
        "Please validate the parameters passed, especially the 'mode' metadata"
      );
  } catch (error: any) {
    // Reset the authenticated field in the database
    await UserModel.updateOne(
      { email: req.body.email },
      { $set: { authenticated: false } }
    );
    return res.status(500).json(error.message || error);
  }
};

export const createOTP = async (
  req: Request<any, any, { email: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
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
  } catch (error: any) {
    return res.status(500).json(error.message || error);
  }
};
