import { Request, Response } from "express";
import {
  TokenResponseClass,
  convertFrombase64,
  parseErrorMsg,
  refreshAccessToken,
  validateAccessToken as validateToken,
} from "../utils/utils";
import { TokenDataType, TokenObjType } from "../types";
import { JwtPayload, decode } from "jsonwebtoken";

export const validateAccessToken = async (
  req: Request<
    any,
    any,
    { access_token: string; secret?: string; expires_in?: number }
  >,
  res: Response
) => {
  // Get secret key from request body
  const secretKey = req.body?.secret;

  // Validate the passed token
  const tokenDetails = validateToken(req.body.access_token, secretKey);

  // If token is expired
  if (
    !tokenDetails.status &&
    tokenDetails.decoded.name === "TokenExpiredError"
  ) {
    let response: TokenObjType;
    try {
      // Refresh the access token if expired
      // Get the refresh token from the request
      const refresh_token =
        req.cookies["refresh_token"] || req.headers["refresh-token"];
      // Decode the token and get the ID of the user
      const userID = (
        decode(req.body.access_token) as JwtPayload & TokenDataType
      ).user_ID;
      response = await refreshAccessToken(refresh_token, userID, {
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
    if (!newTokenDetails.status) return res.status(401).json(`Unauthorized`);

    // If token was refreshed, return token details alongside new access and refresh tokens
    return res.status(201).json({
      ...newTokenDetails.decoded,
      tokens: new TokenResponseClass(
        response.accessToken,
        response.refreshToken
      ),
    });
  }
  // If token is invalid
  else if (
    !tokenDetails.status &&
    tokenDetails.decoded.name !== "TokenExpiredError"
  ) {
    return res
      .status(401)
      .json(
        `Unauthorized: Invalid access token. Error ${tokenDetails.decoded.name}`
      );
  }

  // Return the token details and 200 success message if token is authenticated
  return res.status(200).json(tokenDetails.decoded);
};
