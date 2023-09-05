import { Router } from "express";
import { refreshToken } from "../controllers/refresh_token";
import { validateApiKey } from "../utils/utils";

const refreshTokenRoutes = Router();

refreshTokenRoutes.post("/", validateApiKey, refreshToken);

export default refreshTokenRoutes;
