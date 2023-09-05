"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const login_1 = require("../controllers/login");
const utils_1 = require("../utils/utils");
const loginRoutes = (0, express_1.Router)();
loginRoutes.post("/", utils_1.validateApiKey, login_1.loginUser);
exports.default = loginRoutes;
