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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const utils_1 = require("../utils/utils");
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate the body being passed to the request
    const result = (0, utils_1.validateObjectProperties)(req.body, {
        keys: ["user_type", "government_ID", "email", "password"],
        strict: false,
        returnMissingKeys: true,
    });
    if (!result || (typeof result === "object" && !result.valid)) {
        return res
            .status(400)
            .json(`Invalid body passed. ${typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""}`);
    }
    try {
        const user = yield (0, utils_1.createNewUser)(req.body);
        // sign otp access token
        const accessToken = (0, utils_1.generateAccessToken)({
            user_ID: user._id,
            user_role: user.user_type,
        }, utils_1.otpJwtSecret, 60 * 60);
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
    }
    catch (e) {
        console.log("ERROR MSG: ", e.message);
        // If the user already exists
        const err = (0, utils_1.parseErrorMsg)(e);
        if (typeof err === "object" && err.code === 409)
            return res
                .status(409)
                .json(`User with email '${req.body.email}' already exists`);
        return res.status(500).json(`Something went wrong`);
    }
});
exports.registerUser = registerUser;
