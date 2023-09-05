"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const refreshTokenModel = new mongoose_1.default.Schema({
    id: { type: String, required: true },
    user_ID: { type: String, required: true },
    expires_in: { type: Date, requred: true },
    valid_days: { type: Number, required: true },
    user_role: { type: String, required: true },
});
const RefreshTokenModel = mongoose_1.default.model("RefreshTokens", refreshTokenModel);
exports.default = mongoose_1.default.models.RefreshTokens || RefreshTokenModel;
