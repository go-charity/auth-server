import { Request, Response } from "express";
import {
  createNewUser,
  generateAccessToken,
  otpJwtSecret,
  parseErrorMsg,
  validateObjectProperties,
} from "../utils/utils";
import { UserType } from "../types";

export const registerUser = async (
  req: Request<any, any, UserType>,
  res: Response
) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["user_type", "government_ID", "email", "password"],
    strict: false,
    returnMissingKeys: true,
  });
  if (!result || (typeof result === "object" && !result.valid)) {
    return res
      .status(400)
      .json(
        `Invalid body passed. ${
          typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""
        }`
      );
  }

  try {
    const user = await createNewUser(req.body);
    // sign otp access token
    const accessToken = generateAccessToken(
      {
        user_ID: user._id as any,
        user_role: user.user_type,
      },
      otpJwtSecret,
      60 * 60
    );

    // Set the access token to the response cookies
    res.cookie("otp_access_token", accessToken, {
      path: "/v1/otp",
      domain: process.env.API_DOMAIN,
      httpOnly: false,
      secure: true,
    });
    return res.status(201).json({
      message: "User created successfully",
      access_token: accessToken,
    });
  } catch (e: any) {
    console.log("ERROR MSG: ", e.message);
    // If the user already exists
    const err = parseErrorMsg(e);
    if (typeof err === "object" && err.code === 409)
      return res
        .status(409)
        .json(`User with email '${req.body.email}' already exists`);

    return res.status(500).json(`Something went wrong`);
  }
};
