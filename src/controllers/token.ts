import { Request, Response } from "express";
import {
  TokenResponseClass,
  convertFrombase64,
  parseErrorMsg,
  refreshAccessToken,
  validateAccessToken as validateToken,
} from "../utils/utils";
import { TokenObjType } from "../types";

export const validateAccessToken = async (
  req: Request<
    any,
    any,
    { access_token: string; secret?: string; expires_in?: number }
  >,
  res: Response
) => {
  // Get secret key from request body
  const secretKey = req.body?.secret
    ? convertFrombase64(req.body?.secret)
    : undefined;
  // Validate the passed token
  const tokenDetails = validateToken(req.body.access_token, secretKey);

  // If token is expired or invalid
  if (!tokenDetails) {
    let response: TokenObjType;
    try {
      // Refresh the access token if expired
      const refresh_token =
        req.cookies["refresh_token"] || req.headers["refresh-token"];
      response = await refreshAccessToken(refresh_token, {
        secret: secretKey,
        expiresIn: req.body.expires_in,
      });
    } catch (e: any) {
      // If there was an error refreshing the access token
      const err = parseErrorMsg(e);
      if (typeof err === "object" && err.code === 401)
        return res.status(401).json(`Unauthorized. Issue is ${err?.message}`);
      return res
        .status(500)
        .json(
          `Something went wrong while refreshing the access token: '${err}'`
        );
    }

    // Validate refreshed access token
    const newTokenDetails = validateToken(response.accessToken, secretKey);

    // If token is not authenticated
    if (!newTokenDetails) return res.status(401).json(`Unauthorized`);

    // If token was refreshed, return token details alongside new access and refresh tokens
    return res.status(201).json({
      ...newTokenDetails,
      tokens: new TokenResponseClass(
        response.accessToken,
        response.refreshToken
      ),
    });
  }

  // Return the token details and 200 success message if token is authenticated
  return res.status(200).json(tokenDetails);
};
