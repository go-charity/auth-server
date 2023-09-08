import express from "express";
import { config } from "dotenv";
import cors from "cors";
import connect from "./models/db.config";
import loginRoutes from "./routes/login";
import registerRoutes from "./routes/register";
import refreshTokenRoutes from "./routes/refresh_token";
import bodyParser from "body-parser";
import otpRoutes from "./routes/otp";
import cookieParser from "cookie-parser";
import { apiKey } from "./utils/utils";

config();
connect();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_DOMAIN,
  process.env.CLIENT_AUTH_SUB_DOMAIN,
];

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      if (allowedOrigins.includes(origin) || !origin) cb(null, true);
      else throw new Error(`Origin '${origin}' not allowed`);
    },
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/v1/login", loginRoutes);
app.use("/v1/register", registerRoutes);
app.use("/v1/refresh_token", refreshTokenRoutes);
app.use("/v1/otp", otpRoutes);

export default app;
