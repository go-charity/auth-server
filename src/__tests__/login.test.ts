import bcrypt from "bcrypt";
import {
  TokenResponseClass,
  UserModelClass,
  apiKey,
  convertTobase64,
} from "./../utils/utils";
import request from "supertest";
import app from "../app";
import UserModel from "../models/Users";
import mongoose from "mongoose";

describe("Test cases responsible for the login endpoint", () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });
  afterAll(async () => {
    await UserModel.deleteMany({});
    mongoose.disconnect();
  });

  test("Should return 401 status code if request is sent without a valid API key", async () => {
    const res = await request(app)
      .post("/v1/login")
      .send({
        email: "onukwilip@gmail.com",
        password: convertTobase64("123456"),
      });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "invalid api key".toLowerCase()
    );
  });
  test("Should return 401 status code if request is sent with an invalid API key", async () => {
    const res = await request(app)
      .post("/v1/login")
      .set("Api-key", convertTobase64("peepee"))
      .send({
        email: "onukwilip@gmail.com",
        password: convertTobase64("123456"),
      });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "invalid api key".toLowerCase()
    );
  });
  test("Should return 401 status code if user doesn't exist", async () => {
    const res = await request(app)
      .post("/v1/login")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        email: "onukwilip@gmail.com",
        password: convertTobase64("123456"),
      });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Invalid credentials".toLowerCase()
    );
  });
  test("Should return 400 status code if request body is invalid", async () => {
    const res = await request(app)
      .post("/v1/login")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        eil: "onukwilip@gmail.com",
      });

    expect(res.statusCode).toBe(400);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "missing properties are: email, password".toLowerCase()
    );
  });
  test("Should return 403 status code if user account hasn't been authenticated yet!", async () => {
    await UserModel.create(
      new UserModelClass(
        "orphanage",
        "119u88hshsaj",
        "onukwilip@gmail.com",
        await bcrypt.hash("1234567", 10),
        false
      )
    );

    const res = await request(app)
      .post("/v1/login")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        email: "onukwilip@gmail.com",
        password: convertTobase64("1234567"),
      });

    expect(res.statusCode).toBe(403);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Unverified email address".toLowerCase()
    );
  });
  test("Should return 200 status code with the access and refresh tokens!", async () => {
    const user = await UserModel.create(
      new UserModelClass(
        "orphanage",
        "119u88hshsaj",
        "onukwilip@gmail.com",
        await bcrypt.hash("1234567", 10),
        true
      )
    );

    const res = await request(app)
      .post("/v1/login")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        email: "onukwilip@gmail.com",
        password: convertTobase64("1234567"),
      });

    expect(res.statusCode).toBe(200);
    const data = res.body as TokenResponseClass;
    expect(typeof data.access_token).toBe("string");
    expect(typeof data.refresh_token).toBe("string");
  });
  test("Should return 401 status code if password is invalid", async () => {
    const user = await UserModel.create(
      new UserModelClass(
        "orphanage",
        "119u88hshsaj",
        "onukwilip@gmail.com",
        await bcrypt.hash("1234567", 10),
        true
      )
    );

    const res = await request(app)
      .post("/v1/login")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        email: "onukwilip@gmail.com",
        password: convertTobase64("123456"),
      });

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "Invalid credentials".toLowerCase()
    );
  });
});
