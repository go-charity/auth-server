import { Router } from "express";
import { loginUser } from "../controllers/login";
import { validateApiKey } from "../utils/utils";

/**
 * @swagger
 * tags:
 *     - name: Login
 *       description: The Login endpoint for authenticating usernames and passwords
 */

const loginRoutes = Router();

/**
 * @swagger
 * /v1/login:
 *  parameters:
 *     - in: header
 *       name: Api-key
 *       type: string
 *       required: true
 *       example: ZmFlYTZkNGEyYTM4NDc1MWJjZTI5ZGI3YWEzNjA3MTg=
 *       description: Base64 encoded API key
 *  post:
 *     tags:
 *          - Login
 *     summary: Authenticate a User's email and password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                default: johndoe@mail.com
 *              password:
 *                type: string
 *                default: johnDoe20!@
 *     responses:
 *      201:
 *          description: User is authenticated
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
 *      403:
 *          description: User's email address is unverified
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                              default: Unverified email address
 *                          otp_access_token:
 *                              type: string
 *                              default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.jF2cxRszqyIbI6XCJeXKJGm_M9f09HUOo6WfubBd9qw
 *                          otp_refresh_token:
 *                              type: string
 *                              default: faea6d4a2a384751bce29db7aa360718
 *      401:
 *          description: Returned when no API key is present, or user details are invalid
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: "'Invalid API key' OR 'Invalid Credientials'"
 *      400:
 *          description: Returned when the request body schema is invalid
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: "Invalid body passed. Missing keys are: {The missing keys in the schema}"
 *      500:
 *          description: Server Error
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: Server error
 */
loginRoutes.post("/", validateApiKey, loginUser);

export default loginRoutes;
