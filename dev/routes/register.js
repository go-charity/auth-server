"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const register_1 = require("../controllers/register");
const utils_1 = require("../utils/utils");
const registerRoutes = (0, express_1.Router)();
registerRoutes.post("/", utils_1.validateApiKey, register_1.registerUser);
exports.default = registerRoutes;
