import { Router } from "express";
import { validateAccessToken } from "../controllers/token";
import { validateApiKey } from "../utils/utils";

const tokenRoutes = Router();

tokenRoutes.post(
  "/validate",
  validateApiKey,
  // Method to validate that the access token is available in the request header or cookies
  (req, res, next) => {
    if (req.cookies.access_token) {
      req.body.access_token = req.cookies.access_token;
    } else {
      if (!Object.keys(req.headers).includes("authorization"))
        return res.status(401).json("Unauthorized user");
      const auth = req.headers.authorization;
      if (auth?.split(" ")[0] !== "Bearer")
        return res.status(401).json("Unauthorized user");

      req.body.access_token = req.headers.authorization?.split(" ")[1] || "";
    }

    next();
  },
  validateAccessToken
);

export default tokenRoutes;
