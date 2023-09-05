import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app";
import {
  RefreshTokenModelClass,
  apiKey,
  convertTobase64,
} from "../utils/utils";
import RefrestTokenModel from "../models/RefrestTokens";
import { v4 as uuidv4 } from "uuid";

describe("Test cases responsible for the refresh_token endpoint", () => {
  beforeEach(async () => {
    await RefrestTokenModel.deleteMany({});
  });

  test("Should return 401 status code if request is sent without a valid API key", async () => {
    const res = await request(app)
      .post("/v1/refresh_token")
      .send({ refresh_token: "" });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "invalid api key".toLowerCase()
    );
  });
  test("Should return 401 status code if refresh token doesn't exist", async () => {
    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({ refresh_token: "" });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Invalid refresh token".toLowerCase()
    );
  });
  test("Should return 401 status code if refresh token has expired", async () => {
    const refreshTokenID = uuidv4().split("-").join("");
    await RefrestTokenModel.create(
      new RefreshTokenModelClass(
        refreshTokenID,
        "onukwilip@gmail.com",
        new Date(new Date().setDate(new Date().getDate() - 1)),
        30,
        "orphanage"
      )
    );

    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({ refresh_token: refreshTokenID });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Invalid refresh token".toLowerCase()
    );
  });
  test("Should return 400 status code if request body is invalid", async () => {
    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({});

    expect(res.statusCode).toBe(400);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "missing properties are: refresh_token".toLowerCase()
    );
  });
});
