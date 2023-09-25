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
exports.validateAccessToken = void 0;
const utils_1 = require("../utils/utils");
const validateAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Get secret key from request body
    const secretKey = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.secret)
        ? (0, utils_1.convertFrombase64)((_b = req.body) === null || _b === void 0 ? void 0 : _b.secret)
        : undefined;
    // Validate the passed token
    const tokenDetails = (0, utils_1.validateAccessToken)(req.body.access_token, secretKey);
    // If token is expired or invalid
    if (!tokenDetails) {
        let response;
        try {
            // Refresh the access token if expired
            const refresh_token = req.cookies["refresh_token"] || req.headers["refresh-token"];
            response = yield (0, utils_1.refreshAccessToken)(refresh_token, {
                secret: secretKey,
                expiresIn: req.body.expires_in,
            });
        }
        catch (e) {
            // If there was an error refreshing the access token
            const err = (0, utils_1.parseErrorMsg)(e);
            if (typeof err === "object" && err.code === 401)
                return res.status(401).json(`Unauthorized. Issue is ${err === null || err === void 0 ? void 0 : err.message}`);
            return res
                .status(500)
                .json(`Something went wrong while refreshing the access token: '${err}'`);
        }
        // Validate refreshed access token
        const newTokenDetails = (0, utils_1.validateAccessToken)(response.accessToken, secretKey);
        // If token is not authenticated
        if (!newTokenDetails)
            return res.status(401).json(`Unauthorized`);
        // If token was refreshed, return token details alongside new access and refresh tokens
        return res.status(201).json(Object.assign(Object.assign({}, newTokenDetails), { tokens: new utils_1.TokenResponseClass(response.accessToken, response.refreshToken) }));
    }
    // Return the token details and 200 success message if token is authenticated
    return res.status(200).json(tokenDetails);
});
exports.validateAccessToken = validateAccessToken;
