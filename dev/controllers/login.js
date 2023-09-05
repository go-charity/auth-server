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
exports.loginUser = void 0;
const Users_1 = __importDefault(require("../models/Users"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const utils_1 = require("../utils/utils");
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate the body being passed to the request
    const result = (0, utils_1.validateObjectProperties)(req.body, {
        keys: ["email", "password"],
        strict: false,
        returnMissingKeys: true,
    });
    if (!result || (typeof result === "object" && !result.valid))
        return res
            .status(400)
            .json(`Invalid body passed. ${typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""}`);
    const body = req.body;
    // Fetch the user from the database
    const user = yield Users_1.default.findOne({ email: body === null || body === void 0 ? void 0 : body.email });
    if (!user)
        return res.status(401).json("Invalid credentials");
    const passwordisValid = yield bcrypt_1.default.compare((0, utils_1.convertFrombase64)(body === null || body === void 0 ? void 0 : body.password), user === null || user === void 0 ? void 0 : user.password);
    // Validate the user's details
    if (!passwordisValid)
        return res.status(401).json("Invalid credentials");
    if (user.authenticated === false || !user.authenticated)
        return res.status(403).json("Unverified email address");
    // sign jwt and refresh token
    const tokenObj = yield (0, utils_1.generateTokens)({
        user_ID: user._id,
        user_role: user.user_type,
    });
    return res
        .status(200)
        .json(new utils_1.TokenResponseClass(tokenObj.accessToken, tokenObj.refreshToken));
});
exports.loginUser = loginUser;
