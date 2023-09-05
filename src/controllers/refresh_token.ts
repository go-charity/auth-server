import { Request, Response } from "express";
import {
  TokenResponseClass,
  refreshAccessToken,
  validateObjectProperties,
} from "../utils/utils";

export const refreshToken = async (
  req: Request<any, any, { refresh_token: string }>,
  res: Response
) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["refresh_token"],
    strict: false,
    returnMissingKeys: true,
  });
  if (!result || (typeof result === "object" && !result.valid)) {
    return res
      .status(400)
      .json(
        `Invalid body passed. ${
          typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""
        }`
      );
  }

  try {
    const tokenObj = await refreshAccessToken(req.body.refresh_token);
    return res
      .status(200)
      .json(
        new TokenResponseClass(tokenObj.accessToken, tokenObj.refreshToken)
      );
  } catch (e: any) {
    if (
      String(e.message).includes("code") &&
      JSON.parse(e.message)?.code === 401
    )
      return res.status(401).json("Invalid refresh token");
    return res.status(500).json("Something went wrong...");
  }
};
