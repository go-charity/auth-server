import { NextFunction, Request, Response, Router } from "express";
import { createOTP, verifyOTP } from "../controllers/otp";
import {
  TokenResponseClass,
  otpJwtSecret,
  parseErrorMsg,
  refreshAccessToken,
  setOTPTokens,
  validateAccessToken,
  validateApiKey,
} from "../utils/utils";
import jwt, { JwtPayload, decode } from "jsonwebtoken";
import { TokenDataType, TokenObjType } from "../types";

const otpRoutes = Router();

/**
 * Validates the presence of a valid OTP access and refresh tokens in the OTP request
 * @param req The request object
 * @param res The response object
 * @param next The express next function
 * @returns void
 */
const validateOTPTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.cookies.otp_access_token) {
    if (!validateAccessToken(req.cookies.otp_access_token, otpJwtSecret).status)
      return res.status(401).json("Unauthorized user");
  } else {
    if (!Object.keys(req.headers).includes("authorization"))
      return res.status(401).json("Unauthorized user");
    const auth = req.headers.authorization;
    if (auth?.split(" ")[0] != "Bearer")
      return res.status(401).json("Unauthorized user");

    const otp_access_token = auth.split(" ")[1];
    const validatedToken = validateAccessToken(otp_access_token, otpJwtSecret);

    if (!validatedToken.status) {
      if (validatedToken.decoded.name === "TokenExpiredError") {
        let response: TokenObjType;
        try {
          // Refresh the access token if expired
          // Get the refresh token from the request
          const refresh_token =
            req.cookies["otp_refresh_token"] ||
            req.headers["otp-refresh-token"];

          // TODO: Check the number of times the user with the session sent has tried to verify his/her OTP
          // TODO: If it's greater than 5 trials, return 409 Max tries reached

          // Decode the token and get the ID of the user
          const userID = (
            decode(otp_access_token) as JwtPayload & TokenDataType
          ).user_ID;
          response = await refreshAccessToken(refresh_token, userID, {
            secret: otpJwtSecret,
          });
        } catch (e: any) {
          // If there was an error refreshing the access token
          const err = parseErrorMsg(e);
          if (typeof err === "object" && err.code === 401)
            return res
              .status(401)
              .json(`Unauthorized. Issue is ${err?.message}`);
          return res
            .status(500)
            .json(
              `Something went wrong while refreshing the access token: '${err}'`
            );
        }

        // Validate refreshed access token
        const newTokenDetails = validateAccessToken(
          response.accessToken,
          otpJwtSecret
        );

        // If token is not authenticated
        if (!newTokenDetails.status)
          return res.status(401).json(`Unauthorized`);

        // If token was refreshed, set new access and refresh tokens in the response headers and cookies
        await setOTPTokens(res, response);
        res.setHeader("Otp-access-token", response.accessToken);
        res.setHeader("Otp-refresh-token", response.refreshToken);
      }
      if (validatedToken.decoded.name !== "TokenExpiredError")
        return res.status(401).json("Unauthorized user");
    }
  }

  next();
};

/**
 * Validates the presence of a valid mode specification in the access token in the OTP request
 * @param req The request object
 * @param res The response object
 * @param next The express next function
 * @returns void
 */
const validateModeParameter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const mode = (
    jwt.decode(
      req.cookies.otp_access_token || req.headers.authorization?.split(" ")?.[1]
    ) as any
  )?.mode;

  if (mode !== "login" && mode !== "change-password")
    return res
      .status(422)
      .json(
        "The OTP request's mode must be either 'login' or 'change-password'"
      );
  next();
};

otpRoutes.post(
  "/verify",
  validateApiKey,
  validateOTPTokens,
  validateModeParameter,
  verifyOTP
);
otpRoutes.post(
  "/create",
  validateApiKey,
  validateOTPTokens,
  validateModeParameter,
  createOTP
);

export default otpRoutes;
