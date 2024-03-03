import { Router } from "express";
import { validateAccessToken } from "../controllers/token";
import { validateApiKey } from "../utils/utils";

/**
 * @swagger
 * tags:
 *     - name: Token validation
 *       description: The endpoints responsible for validating access and refresh tokens from other microservices
 */
const tokenRoutes = Router();

/**
 * @swagger
 * /v1/validate:
 *  parameters:
 *     - in: header
 *       name: Api-key
 *       type: string
 *       required: true
 *       example: ZmUxMzIzMTJiMmZiNDJiZWJiMDQ0MTYyZWY0MGUzY2U=
 *       description: Base64 encoded API key
 *     - in: header
 *       name: Authorization
 *       type: string
 *       required: true
 *       example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.jF2cxRszqyIbI6XCJeXKJGm_M9f09HUOo6WfubBd9qw
 *       description: Access token
 *     - in: header
 *       name: Refresh-token
 *       type: string
 *       required: true
 *       example: faea6d4a2a384751bce29db7aa360718
 *       description: Refresh token
 *  post:
 *     tags:
 *          - Token validation
 *     summary: Validates access and refresh tokens from other GO.Charity microservices
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - access_token
 *              - refresh_token
 *            properties:
 *              access_token:
 *                type: string
 *                default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.jF2cxRszqyIbI6XCJeXKJGm_M9f09HUOo6WfubBd9qw
 *              refresh_token:
 *                type: string
 *                default: faea6d4a2a384751bce29db7aa360718
 *     responses:
 *      200:
 *          description: Token is valid OR refreshed
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          user_ID:
 *                              type: string
 *                              default: faea6d4a2a384751bce29db7aa360718
 *                          user_role:
 *                              type: string
 *                              default: orphanage
 *                          tokens:
 *                              type: object
 *                              properties:
 *                                   access_token:
 *                                       type: string
 *                                       default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.jF2cxRszqyIbI6XCJeXKJGm_M9f09HUOo6WfubBd9qw
 *                                   refresh_token:
 *                                       type: string
 *                                       default: faea6d4a2a384751bce29db7aa360718
 *      401:
 *          description: Returned when no API key is present OR invalid tokens
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: "'Invalid API key' OR 'Unauthorized'"
 *      500:
 *          description: Server Error
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: Server error
 */
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
