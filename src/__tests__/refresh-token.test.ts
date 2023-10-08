import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app";
import {
  RefreshTokenModelClass,
  TokenResponseClass,
  apiKey,
  convertTobase64,
  generateRefreshToken,
  generateTokens,
} from "../utils/utils";
import RefrestTokenModel from "../models/RefrestTokens";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

describe("Test cases responsible for the refresh_token endpoint", () => {
  const authData = {
    user_ID: "prince2006",
    user_role: "orphanage",
  };
  beforeEach(async () => {
    await RefrestTokenModel.deleteMany({});
  });
  afterAll(async () => {
    await RefrestTokenModel.deleteMany({});
    await mongoose.disconnect();
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
  test("Should return 401 status code if request is sent with an invalid API key", async () => {
    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64("peepee"))
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
      .send({ refresh_token: "", access_token: "" });

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
        authData.user_ID,
        new Date(new Date().setDate(new Date().getDate() - 1)),
        30,
        "orphanage"
      )
    );

    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({ refresh_token: refreshTokenID, access_token: "" });

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
    expect(data.toString()).toMatch(
      /missing.*properties.*refresh_token.*access_token/i
    );
  });
  test("Should return 400 status code if access token is NOT provided", async () => {
    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({ refresh_token: "" });

    expect(res.statusCode).toBe(400);
    const data = res.body as {};
    expect(data.toString()).toMatch(/missing.*properties.*access_token/i);
  });
  test("Should return 400 status code if refresh token is NOT provided", async () => {
    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({ access_token: "" });

    expect(res.statusCode).toBe(400);
    const data = res.body as {};
    expect(data.toString()).toMatch(/missing.*properties.*refresh_token/i);
  });
  test("Should return 200 status code if token is refreshed successfully", async () => {
    // const refreshTokenID = await generateRefreshToken(authData, {
    //   type: "time",
    //   amount: 60,
    // });
    const tokens = await generateTokens(authData, "12345", {
      access_token: 1000 * 1,
      refresh_token: { type: "time", amount: 1000 * 1 },
    });

    const res = await request(app)
      .post("/v1/refresh_token")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        refresh_token: tokens.refreshToken,
        access_token: tokens.accessToken,
      });

    expect(res.statusCode).toBe(200);
    const data = res.body as TokenResponseClass;
    expect(typeof data.access_token).toBe("string");
    expect(typeof data.refresh_token).toBe("string");
  });
});
