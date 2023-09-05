"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userModel = new mongoose_1.default.Schema({
    user_type: {
        type: String,
        enum: {
            values: ["donor", "orphanage"],
        },
        required: true,
    },
    government_ID: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    authenticated: {
        type: Boolean,
        required: true,
    },
});
const UserModel = mongoose_1.default.model("Users", userModel);
exports.default = mongoose_1.default.models.Users || UserModel;
