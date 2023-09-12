import bcrypt from "bcrypt";
import {
  TokenResponseClass,
  apiKey,
  convertTobase64,
  generateAccessToken,
  generateTokens,
} from "./../utils/utils";
import request from "supertest";
import app from "../app";
import { TokenDataType, TokenObjType } from "../types";
import RefrestTokens from "../models/RefrestTokens";
import connect from "../models/db.config";

describe("Test cases responsible for the token endpoint", () => {
  const authData = {
    user_ID: "prince2006",
    user_role: "donor",
  };
  let token: TokenObjType;

  beforeAll(() => {
    connect();
  });
  beforeEach(async () => {
    await RefrestTokens.deleteMany({});
    token = await generateTokens(authData, undefined, {
      access_token: 60,
      refresh_token: { type: "time", amount: 60 },
    });
  });

  test("Should return 401 status code if request is sent without a valid API key", async () => {
    const res = await request(app).post("/v1/token/validate");

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "invalid api key".toLowerCase()
    );
  });
  test("Should return 401 status code if request is sent with an invalid API key", async () => {
    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64("peepee"));

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "invalid api key".toLowerCase()
    );
  });
  test("Should return 401 status code if request is sent with no access token", async () => {
    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey));

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Unauthorized".toLowerCase()
    );
  });
  test("Should return 401 status code if request is sent with an invalid 'authorization' header (without the 'Bearer' prefix)", async () => {
    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey))
      .set("Authorization", token.accessToken);

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Unauthorized".toLowerCase()
    );
  });
  test("Should return 200 status code if request is sent with a valid access token in the 'authorization' header", async () => {
    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey))
      .set("Authorization", `Bearer ${token.accessToken}`);

    expect(res.statusCode).toBe(200);
    const data = res.body as TokenDataType;
    expect(data.user_ID).toBe(authData.user_ID);
    expect(data.user_role).toBe(authData.user_role);
  });
  test("Should return 200 status code if request is sent with a valid access token in the 'access_token' cookie", async () => {
    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey))
      .set("Cookie", [`access_token=${token.accessToken}`]);

    expect(res.statusCode).toBe(200);
    const data = res.body as TokenDataType;
    expect(data.user_ID).toBe(authData.user_ID);
    expect(data.user_role).toBe(authData.user_role);
  });
  test("Should return 201 status code if request is sent with a valid access token which has expired, but has a valid refresh token (in the header)", async () => {
    const token = await generateTokens(authData, "123456", {
      access_token: -10,
      refresh_token: { type: "time", amount: 60 },
    });

    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey))
      .set("Cookie", [`access_token=${token.accessToken}`])
      .set("refresh-token", token.refreshToken)
      .send({
        secret: "123456",
      });

    const data = res.body as TokenDataType & { tokens: TokenResponseClass };

    expect(res.statusCode).toBe(201);
    expect(data.user_ID).toBe(authData.user_ID);
    expect(data.user_role).toBe(authData.user_role);
    expect(typeof data.tokens.access_token).toBe("string");
    expect(typeof data.tokens.refresh_token).toBe("string");
  });
  test("Should return 201 status code if request is sent with a valid access token which has expired, but has a valid refresh token (in the cookie)", async () => {
    const token = await generateTokens(authData, "123456", {
      access_token: -10,
      refresh_token: { type: "time", amount: 60 },
    });

    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey))
      .set("Cookie", [
        `access_token=${token.accessToken}`,
        `refresh_token=${token.refreshToken}`,
      ])
      .send({
        secret: "123456",
      });

    const data = res.body as TokenDataType & { tokens: TokenResponseClass };

    expect(res.statusCode).toBe(201);
    expect(data.user_ID).toBe(authData.user_ID);
    expect(data.user_role).toBe(authData.user_role);
    expect(typeof data.tokens.access_token).toBe("string");
    expect(typeof data.tokens.refresh_token).toBe("string");
  });
  test("Should return 401 status code if request is sent with a valid access token which has expired, and an expired refresh token (in the cookie)", async () => {
    const token = await generateTokens(authData, "123456", {
      access_token: -10,
      refresh_token: { type: "time", amount: -10 },
    });

    const res = await request(app)
      .post("/v1/token/validate")
      .set("Api-key", convertTobase64(apiKey))
      .set("Cookie", [
        `access_token=${token.accessToken}`,
        `refresh_token=${token.refreshToken}`,
      ])
      .send({
        secret: "123456",
      });

    const data = res.body as {};

    expect(res.statusCode).toBe(401);
    expect(data.toString().toLowerCase()).toContain(
      "Unauthorized".toLowerCase()
    );
  });
});
