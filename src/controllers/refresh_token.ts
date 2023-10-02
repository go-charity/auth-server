import { Request, Response } from "express";
import {
  TokenResponseClass,
  parseErrorMsg,
  refreshAccessToken,
  validateObjectProperties,
} from "../utils/utils";
import { JwtPayload, decode } from "jsonwebtoken";
import { TokenDataType } from "../types";

export const refreshToken = async (
  req: Request<any, any, { refresh_token: string; access_token: string }>,
  res: Response
) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["refresh_token", "access_token"],
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
    const userID = (decode(req.body.access_token) as JwtPayload & TokenDataType)
      ?.user_ID;
    const tokenObj = await refreshAccessToken(req.body.refresh_token, userID);
    return res
      .status(200)
      .json(
        new TokenResponseClass(tokenObj.accessToken, tokenObj.refreshToken)
      );
  } catch (e: any) {
    const err = parseErrorMsg(e);
    if (typeof err === "object" && err.code === 401)
      return res.status(401).json("Invalid refresh token");
    return res.status(500).json(`Something went wrong...: ${e?.message || e}`);
  }
};
