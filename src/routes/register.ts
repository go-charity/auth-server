import { Router } from "express";
import { registerUser } from "../controllers/register";
import { validateApiKey } from "../utils/utils";

/**
 * @swagger
 * tags:
 *     - name: Register
 *       description: The Login endpoint for authenticating usernames and passwords
 */
const registerRoutes = Router();

/**
 * @swagger
 * /v1/register:
 *  parameters:
 *     - in: header
 *       name: Api-key
 *       type: string
 *       required: true
 *       example: ZmFlYTZkNGEyYTM4NDc1MWJjZTI5ZGI3YWEzNjA3MTg=
 *       description: Base64 encoded API key
 *  post:
 *     tags:
 *          - Register
 *     summary: Create a new user account
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - user_type
 *              - government_ID
 *              - metadata
 *                  - fullname
 *                  - phone_number
 *                  - tagline
 *              - email
 *              - password
 *            properties:
 *              user_type:
 *                type: string
 *                default: orphanage
 *              email:
 *                type: string
 *                default: johndoe@mail.com
 *              password:
 *                type: string
 *                default: johnDoe20!@
 *              government_ID:
 *                type: string
 *                default: 88jjiijn
 *              metadata:
 *                type: object
 *                required:
 *                  - fullname
 *                  - phone_number
 *                  - tagline
 *                properties:
 *                  fullname:
 *                      type: string
 *                      default: John Doe
 *                  phone_number:
 *                      type: string
 *                      default: +234909872981923
 *                  tagline:
 *                      type: string
 *                      default: Giving hope to needy children
 *     responses:
 *      201:
 *          description: User is created
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                              default: User created successfully
 *                          access_token:
 *                              type: string
 *                              default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.jF2cxRszqyIbI6XCJeXKJGm_M9f09HUOo6WfubBd9qw
 *                          refresh_token:
 *                              type: string
 *                              default: faea6d4a2a38-4751bce29db7aa360718
 *      409:
 *          description: User with email address already exists
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: "User with email 'johndoe@gmail.com' already exists"
 *      401:
 *          description: Returned when no API key is present
 *          content:
 *              text/plain:
 *                  schema:
 *                      type: string
 *                      example: 'Invalid API key'
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
registerRoutes.post("/", validateApiKey, registerUser);

export default registerRoutes;
