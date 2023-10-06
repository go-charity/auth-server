import { Request, Response } from "express";
import {
  createNewUser,
  generateAccessToken,
  otpJwtSecret,
  parseErrorMsg,
  setOTPTokens,
  validateObjectProperties,
  validateRegisterEndpointBody,
} from "../utils/utils";
import { UserType } from "../types";

export const registerUser = async (
  req: Request<any, any, UserType>,
  res: Response
) => {
  try {
    // Validate the body being passed to the request
    const result = validateRegisterEndpointBody(req.body);
    if (!result.valid) {
      return res.status(400).json(`Invalid body passed. ${result.format()}`);
    }

    // Create a new user
    const user = await createNewUser(req.body);

    // sign otp access token
    const tokens = await setOTPTokens(
      { _id: user._id.toString(), user_type: user.user_type },
      res
    );

    return res.status(201).json({
      message: "User created successfully",
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  } catch (e: any) {
    console.log("ERROR MSG: ", e.message);
    // If the user already exists
    const err = parseErrorMsg(e);
    if (typeof err === "object" && err.code === 409)
      return res
        .status(409)
        .json(`User with email '${req.body.email}' already exists`);

    return res
      .status(500)
      .json(`Something went wrong: ${(err as any)?.message || e}`);
  }
};
