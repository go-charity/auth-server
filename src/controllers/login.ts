import { Request, Response } from "express";
import UserModel from "../models/Users";
import { UserType } from "../types";
import bcrypt from "bcrypt";
import {
  TokenResponseClass,
  convertFrombase64,
  generateAccessToken,
  generateTokens,
  otpJwtSecret,
  validateObjectProperties,
} from "../utils/utils";

export const loginUser = async (req: Request, res: Response) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["email", "password"],
    strict: false,
    returnMissingKeys: true,
  });
  if (!result || (typeof result === "object" && !result.valid))
    return res
      .status(400)
      .json(
        `Invalid body passed. ${
          typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""
        }`
      );

  const body = req.body as { email: string; password: string };

  // Fetch the user from the database
  const user = await UserModel.findOne<UserType>({ email: body?.email });
  if (!user) return res.status(401).json("Invalid credentials");
  const passwordisValid = await bcrypt.compare(
    convertFrombase64(body?.password),
    user?.password
  );
  // Validate the user's details
  if (!passwordisValid) return res.status(401).json("Invalid credentials");
  if (user.authenticated === false || !user.authenticated) {
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
      httpOnly: true,
      secure: true,
    });
    return res.status(403).json("Unverified email address");
  }

  // sign jwt and refresh token
  const tokenObj = await generateTokens({
    user_ID: user._id as any,
    user_role: user.user_type,
  });

  // Set the access and refresh tokens as cookies
  res.cookie("access_token", tokenObj.accessToken, {
    path: "/",
    domain: process.env.API_DOMAIN,
    httpOnly: true,
    secure: true,
  });
  res.cookie("refresh_token", tokenObj.refreshToken, {
    path: "/",
    domain: process.env.API_DOMAIN,
    httpOnly: true,
    secure: true,
  });

  return res
    .status(200)
    .json(new TokenResponseClass(tokenObj.accessToken, tokenObj.refreshToken));
};
