import { NextFunction, Request, Response, Router } from "express";
import { createOTP, verifyOTP } from "../controllers/otp";
import {
  otpJwtSecret,
  validateAccessToken,
  validateApiKey,
} from "../utils/utils";

const otpRoutes = Router();

/**
 * Validates the presence of a valid OTP Access token in the OTP request
 * @param req The request object
 * @param res The response object
 * @param next The express next function
 * @returns void
 */
const validateOTPAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.cookies.otp_access_token) {
    if (!validateAccessToken(req.cookies.otp_access_token, otpJwtSecret))
      return res.status(401).json("Unauthorized user");
  } else {
    if (!Object.keys(req.headers).includes("authorization"))
      return res.status(401).json("Unauthorized user");
    const auth = req.headers.authorization;
    if (auth?.split(" ")[0] != "Bearer")
      return res.status(401).json("Unauthorized user");
    if (!validateAccessToken(auth.split(" ")[1], otpJwtSecret))
      return res.status(401).json("Unauthorized user");
  }

  next();
};
/**
 * Validates the presence of a valid mode header in the OTP request
 * @param req The request object
 * @param res The response object
 * @param next The express next function
 * @returns void
 */
const validateModeHeader = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!Object.keys(req.headers).includes("mode"))
    return res
      .status(422)
      .json(
        "The 'mode' header specifying the OTP request's mode must be included"
      );
  const mode = req.headers.mode;

  if (mode !== "login" && mode !== "change-password")
    return res
      .status(422)
      .json(
        "The 'mode' header specifying the OTP request's mode must be either 'login' or 'change-password'"
      );
  next();
};

otpRoutes.post(
  "/verify",
  validateApiKey,
  validateOTPAccessToken,
  validateModeHeader,
  verifyOTP
);
otpRoutes.post(
  "/create",
  validateApiKey,
  validateOTPAccessToken,
  validateModeHeader,
  createOTP
);

export default otpRoutes;
