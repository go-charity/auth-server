import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app";
import { UserModelClass, apiKey, convertTobase64 } from "../utils/utils";
import UserModel from "../models/Users";

describe("Test cases responsible for the register endpoint", () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  test("Should return 401 status code if request is sent without a valid API key", async () => {
    const res = await request(app)
      .post("/v1/register")
      .send(
        new UserModelClass(
          "orphanage",
          "1u92u99uh",
          "onukwilip@gmail.com",
          "1234567",
          false
        )
      );

    expect(res.statusCode).toBe(401);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "invalid api key".toLowerCase()
    );
  });
  test("Should return 409 status code if user already exists", async () => {
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
      .post("/v1/register")
      .set("Api-key", convertTobase64(apiKey))
      .send(
        new UserModelClass(
          "orphanage",
          "119u88hshsaj",
          "onukwilip@gmail.com",
          "1234567",
          false
        )
      );

    expect(res.statusCode).toBe(409);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "User with email 'onukwilip@gmail.com' already exists".toLowerCase()
    );
  });
  test("Should return 400 status code if request body is invalid", async () => {
    const res = await request(app)
      .post("/v1/register")
      .set("Api-key", convertTobase64(apiKey))
      .send({
        email: "onukwilip@gmail.com",
      });

    expect(res.statusCode).toBe(400);
    const data = res.body as {};
    expect(data.toString().toLowerCase()).toContain(
      "missing properties are: user_type, government_ID, password".toLowerCase()
    );
  });
});
