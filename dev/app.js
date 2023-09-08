"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const cors_1 = __importDefault(require("cors"));
const db_config_1 = __importDefault(require("./models/db.config"));
const login_1 = __importDefault(require("./routes/login"));
const register_1 = __importDefault(require("./routes/register"));
const refresh_token_1 = __importDefault(require("./routes/refresh_token"));
const body_parser_1 = __importDefault(require("body-parser"));
const otp_1 = __importDefault(require("./routes/otp"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const utils_1 = require("./utils/utils");
(0, dotenv_1.config)();
(0, db_config_1.default)();
const app = (0, express_1.default)();
const allowedOrigins = [
    process.env.CLIENT_DOMAIN,
    process.env.CLIENT_SUB_DOMAIN,
];
app.use((0, cookie_parser_1.default)(utils_1.apiKey));
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (allowedOrigins.includes(origin) || !origin)
            cb(null, true);
        else
            throw new Error(`Origin '${origin}' not allowed`);
    },
    credentials: true,
}));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use("/v1/login", login_1.default);
app.use("/v1/register", register_1.default);
app.use("/v1/refresh_token", refresh_token_1.default);
app.use("/v1/otp", otp_1.default);
exports.default = app;
