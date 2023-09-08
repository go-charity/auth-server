"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const otp_1 = require("../controllers/otp");
const utils_1 = require("../utils/utils");
const otpRoutes = (0, express_1.Router)();
/**
 * Validates the presence of a valid OTP Access token in the OTP request
 * @param req The request object
 * @param res The response object
 * @param next The express next function
 * @returns void
 */
const validateOTPAccessToken = (req, res, next) => {
    if (req.cookies.otp_access_token) {
        if (!(0, utils_1.validateAccessToken)(req.cookies.otp_access_token, utils_1.otpJwtSecret))
            return res.status(401).json("Unauthorized user");
    }
    else {
        if (!Object.keys(req.headers).includes("authorization"))
            return res.status(401).json("Unauthorized user");
        const auth = req.headers.authorization;
        if ((auth === null || auth === void 0 ? void 0 : auth.split(" ")[0]) != "Bearer")
            return res.status(401).json("Unauthorized user");
        if (!(0, utils_1.validateAccessToken)(auth.split(" ")[1], utils_1.otpJwtSecret))
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
const validateModeHeader = (req, res, next) => {
    if (!Object.keys(req.headers).includes("mode"))
        return res
            .status(422)
            .json("The 'mode' header specifying the OTP request's mode must be included");
    const mode = req.headers.mode;
    if (mode !== "login" && mode !== "change-password")
        return res
            .status(422)
            .json("The 'mode' header specifying the OTP request's mode must be either 'login' or 'change-password'");
    next();
};
otpRoutes.post("/verify", utils_1.validateApiKey, validateOTPAccessToken, validateModeHeader, otp_1.verifyOTP);
otpRoutes.post("/create", utils_1.validateApiKey, validateOTPAccessToken, validateModeHeader, otp_1.createOTP);
exports.default = otpRoutes;
