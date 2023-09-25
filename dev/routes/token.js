"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = require("../controllers/token");
const utils_1 = require("../utils/utils");
const tokenRoutes = (0, express_1.Router)();
tokenRoutes.post("/validate", utils_1.validateApiKey, 
// Method to validate that the access token is available in the request header or cookies
(req, res, next) => {
    var _a;
    if (req.cookies.access_token) {
        req.body.access_token = req.cookies.access_token;
    }
    else {
        if (!Object.keys(req.headers).includes("authorization"))
            return res.status(401).json("Unauthorized user");
        const auth = req.headers.authorization;
        if ((auth === null || auth === void 0 ? void 0 : auth.split(" ")[0]) !== "Bearer")
            return res.status(401).json("Unauthorized user");
        req.body.access_token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || "";
    }
    next();
}, token_1.validateAccessToken);
exports.default = tokenRoutes;
