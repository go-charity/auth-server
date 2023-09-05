import { Router } from "express";
import { registerUser } from "../controllers/register";
import { validateApiKey } from "../utils/utils";

const registerRoutes = Router();

registerRoutes.post("/", validateApiKey, registerUser);

export default registerRoutes;
