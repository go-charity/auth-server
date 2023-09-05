import { Router } from "express";
import { loginUser } from "../controllers/login";
import { validateApiKey } from "../utils/utils";

const loginRoutes = Router();

loginRoutes.post("/", validateApiKey, loginUser);

export default loginRoutes;
