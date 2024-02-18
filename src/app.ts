import express from "express";
import { config } from "dotenv";
import cors from "cors";
import connect from "./models/db.config";
import loginRoutes from "./routes/login";
import registerRoutes from "./routes/register";
import refreshTokenRoutes from "./routes/refresh_token";
import bodyParser from "body-parser";
import otpRoutes from "./routes/otp";
import cookieParser from "cookie-parser";
import tokenRoutes from "./routes/token";
import swagger_js_doc from "swagger-jsdoc";
import swagger_ui from "swagger-ui-express";
import { options } from "./utils/utils";

config();
connect();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_DOMAIN,
  process.env.CLIENT_AUTH_SUB_DOMAIN,
  process.env.SERVER_DOMAIN,
];

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      if (allowedOrigins.includes(origin) || !origin) cb(null, true);
      else throw new Error(`Origin '${origin}' not allowed`);
    },
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/v1/login", loginRoutes);
app.use("/v1/register", registerRoutes);
app.use("/v1/refresh_token", refreshTokenRoutes);
app.use("/v1/otp", otpRoutes);
app.use("/v1/token/", tokenRoutes);

/** SWagger endpoint */
const swagger_options: swagger_js_doc.Options = {
  failOnErrors: true,
  definition: {
    openapi: "3.1.0",
    info: {
      title: "GO.Charity Authentication Microservice",
      version: "0.1.0",
      description:
        "This is the official GO.Charity Authentication microservice for authenticating and authorizing the application's users",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "GO.Charity",
        url: "https://www.gocharity.com.ng",
        email: "info@email.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: [`${__dirname}/routes/*.js`],
};
const specs = swagger_js_doc(swagger_options);
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});
app.use(
  "/api-docs",
  swagger_ui.serve,
  swagger_ui.setup(specs, { explorer: true })
);

export default app;
