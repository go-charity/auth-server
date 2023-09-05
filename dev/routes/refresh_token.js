"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const refresh_token_1 = require("../controllers/refresh_token");
const utils_1 = require("../utils/utils");
const refreshTokenRoutes = (0, express_1.Router)();
refreshTokenRoutes.post("/", utils_1.validateApiKey, refresh_token_1.refreshToken);
exports.default = refreshTokenRoutes;
