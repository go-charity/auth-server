"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOTP = exports.verifyOTP = void 0;
const utils_1 = require("../utils/utils");
const OTP_1 = __importDefault(require("../models/OTP"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Users_1 = __importDefault(require("../models/Users"));
const verifyOTP = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate the body being passed to the request
    const result = (0, utils_1.validateObjectProperties)(req.body, {
        keys: ["email", "otp"],
        strict: false,
        returnMissingKeys: true,
    });
    if (!result || (typeof result === "object" && !result.valid))
        return res
            .status(422)
            .json(`Invalid body passed. ${typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""}`);
    const token = yield OTP_1.default.findOne({ email: req.body.email });
    // Validate if the provided email address exists in the database
    if (!token)
        return res.status(400).json("Invalid OTP");
    // Validate if the token provided equals that in the database
    if (!(yield bcrypt_1.default.compare((0, utils_1.convertFrombase64)(req.body.otp), token.token)))
        return res.status(400).json("Invalid OTP");
    // Validate if the token provided is expired
    if (new Date(token.expires_in) <= new Date())
        return res.status(400).json("Invalid OTP");
    // Delete the OTP from the database
    const deleteOTP = yield OTP_1.default.deleteMany({ email: req.body.email });
    if (!deleteOTP)
        return res.status(500).json("Something went wrong");
    const mode = req.headers.mode;
    // If the mode is login, update the authenticated field in the database
    if (mode === "login") {
        yield Users_1.default.updateOne({ email: req.body.email }, { $set: { authenticated: true } });
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
        .json("Please validate the parameters passed, especially the 'mode' header");
});
exports.verifyOTP = verifyOTP;
const createOTP = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate the body being passed to the request
    const result = (0, utils_1.validateObjectProperties)(req.body, {
        keys: ["email"],
        strict: false,
        returnMissingKeys: true,
    });
    if (!result || (typeof result === "object" && !result.valid))
        return res
            .status(422)
            .json(`Invalid body passed. ${typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""}`);
    // Delete previous OTP with same email address
    const deletedOTP = yield OTP_1.default.deleteMany({
        email: req.body.email,
    });
    if (!deletedOTP.acknowledged)
        return res.status(500).json("Something wrong occurred");
    const token = (0, utils_1.generateRandom6digitString)();
    // Create a valid OTP token
    const otp = yield OTP_1.default.create(new utils_1.OTPModelClass(req.body.email, yield bcrypt_1.default.hash(token, 10), (0, utils_1.addTimeToDate)(undefined, 60 * 60)));
    // Send the token to the right email address
    yield (0, utils_1.sendmail)({
        from: process.env.MAIL_ACCOUNT_EMAIL,
        to: req.body.email,
        subject: "Confirm your email address",
        html: (0, utils_1.getOTPEmailTemplate)(token),
    });
    if (!otp)
        return res.status(500).json("Something wrong occurred");
    return res.status(201).json("OTP created successfully");
});
exports.createOTP = createOTP;
