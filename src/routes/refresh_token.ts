import { Router } from "express";
import { refreshToken } from "../controllers/refresh_token";
import { validateApiKey } from "../utils/utils";

const refreshTokenRoutes = Router();

/**
 * @swagger
 * /v1/refresh_token:
 *  post:
 *     summary: Refreshes a User's access token from other GO.Charity microservices
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
 *          description: A new access and refresh token is generated
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          access_token:
 *                              type: string
 *                              default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.jF2cxRszqyIbI6XCJeXKJGm_M9f09HUOo6WfubBd9qw
 *                          refresh_token:
 *                              type: string
 *                              default: faea6d4a2a384751bce29db7aa360718
 *      401:
 *          description: Returned when no API key is present OR invalid refresh token
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: "'Invalid API key' OR 'Invalid refresh token'"
 *      500:
 *          description: Server Error
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: Server error
 */
refreshTokenRoutes.post("/", validateApiKey, refreshToken);

export default refreshTokenRoutes;
