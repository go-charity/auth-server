"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const otpModel = new mongoose_1.default.Schema({
    email: { type: String, required: true },
    token: { type: String, required: true },
    expires_in: { type: Date, required: true },
});
const OTPModel = mongoose_1.default.model("OTP", otpModel);
exports.default = mongoose_1.default.models.OTP || OTPModel;
