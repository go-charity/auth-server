import express from "express";
import { config } from "dotenv";
import cors from "cors";
import connect from "./models/db.config";
import loginRoutes from "./routes/login";
import registerRoutes from "./routes/register";
import refreshTokenRoutes from "./routes/refresh_token";
import bodyParser from "body-parser";

config();
connect();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/v1/login", loginRoutes);
app.use("/v1/register", registerRoutes);
app.use("/v1/refresh_token", refreshTokenRoutes);

export default app;
