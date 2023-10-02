import bcrypt from "bcrypt";
import request from "supertest";
import app from "../app";
import {
  OTPModelClass,
  addTimeToDate,
  apiKey,
  convertTobase64,
  generateAccessToken,
  otpJwtSecret,
} from "../utils/utils";
import * as utils from "../utils/utils";
import OTP from "../models/OTP";
import mongoose from "mongoose";

describe("Test cases responsible for the OTP endpoint", () => {
  const access_token = generateAccessToken(
    { user_ID: "prince2006", user_role: "donor" },
    otpJwtSecret,
    60 * 60
  );
  beforeEach(async () => {
    await OTP.deleteMany({});
  });
  afterAll(async () => {
    await OTP.deleteMany({});
    mongoose.disconnect();
  });

  describe("Test cases responsible for the /verify OTP endpoint", () => {
    test("Should return 401 status code if request is sent without a valid API key", async () => {
      const res = await request(app)
        .post("/v1/otp/verify")
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "invalid api key".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent with an invalid API key", async () => {
      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64("peepee"))
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "invalid api key".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent without a valid access token", async () => {
      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "unauthorized".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent with an invalid access token (in the header - without the 'Bearer' prefix)", async () => {
      const access_token = generateAccessToken(
        { user_ID: "prince2006", user_role: "donor" },
        otpJwtSecret,
        -(60 * 60)
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `${access_token}`)
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "unauthorized".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent with an invalid access token (in the header - with the 'Bearer prefix')", async () => {
      const access_token = generateAccessToken(
        { user_ID: "prince2006", user_role: "donor" },
        otpJwtSecret,
        -(60 * 60)
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "unauthorized".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent with an invalid access token (in the cookie)", async () => {
      const access_token = generateAccessToken(
        { user_ID: "prince2006", user_role: "donor" },
        otpJwtSecret,
        -(60 * 60)
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Cookie", [`otp_access_token=${access_token}`])
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "unauthorized".toLowerCase()
      );
    });
    test("Should return 422 status code if request is sent without a valid mode header", async () => {
      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(422);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "mode must be included".toLowerCase()
      );
    });
    test("Should return 422 status code if request is sent with an invalid mode header", async () => {
      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "jjk")
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(422);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "mode must be either 'login' or 'change-password'".toLowerCase()
      );
    });
    test("Should return 422 status code if request body is invalid", async () => {
      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(422);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "missing properties are: otp".toLowerCase()
      );
    });
    test("Should return 400 status code if OTP doesn't exist", async () => {
      await OTP.create(
        new OTPModelClass(
          "onukwilip@gmail.com",
          await bcrypt.hash("24680", 10),
          addTimeToDate(undefined, 60 * 60)
        )
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("123456"),
        });

      expect(res.statusCode).toBe(400);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "invalid OTP".toLowerCase()
      );
    });
    test("Should return 400 status code if OTP is expired", async () => {
      await OTP.create(
        new OTPModelClass(
          "onukwilip@gmail.com",
          await bcrypt.hash("24680", 10),
          addTimeToDate(undefined, -(60 * 60))
        )
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("24680"),
        });

      expect(res.statusCode).toBe(400);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "invalid OTP".toLowerCase()
      );
    });
    test("Should return 200 status code if OTP is valid and the mode is set to 'login'", async () => {
      await OTP.create(
        new OTPModelClass(
          "onukwilip@gmail.com",
          await bcrypt.hash("24680", 10),
          addTimeToDate(undefined, 60 * 60)
        )
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("24680"),
        });

      expect(res.statusCode).toBe(200);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toBe(
        "User email address validated. Proceed to login".toLowerCase()
      );
    });
    test("Should return 200 status code if OTP is valid and the mode is set to 'change-password'", async () => {
      await OTP.create(
        new OTPModelClass(
          "onukwilip@gmail.com",
          await bcrypt.hash("24680", 10),
          addTimeToDate(undefined, 60 * 60)
        )
      );

      const res = await request(app)
        .post("/v1/otp/verify")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "change-password")
        .send({
          email: "onukwilip@gmail.com",
          otp: convertTobase64("24680"),
        });

      expect(res.statusCode).toBe(200);
      const data = res.body as { message: string; access_token: string };
      expect(data.message).toMatch(
        /user.*email.*address.*validated.*proceed.*to.*change.*password/i
      );
      expect(typeof data.access_token).toBe("string");
    });
  });
  describe("Test cases responsible for the /create OTP endpoint", () => {
    jest
      .spyOn(utils, "sendmail")
      .mockImplementation((content: any) => [true, ""] as any);

    test("Should return 401 status code if request is sent without a valid API key", async () => {
      const res = await request(app).post("/v1/otp/create").send({
        email: "onukwilip@gmail.com",
      });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "invalid api key".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent with an invalid API key", async () => {
      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64("peepee"))
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "invalid api key".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent without a valid access token", async () => {
      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "unauthorized".toLowerCase()
      );
    });
    test("Should return 401 status code if request is sent with an invalid access token", async () => {
      const access_token = generateAccessToken(
        { user_ID: "prince2006", user_role: "donor" },
        otpJwtSecret,
        -(60 * 60)
      );

      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(401);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "unauthorized".toLowerCase()
      );
    });
    test("Should return 422 status code if request is sent without a valid mode header", async () => {
      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(422);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "mode must be included".toLowerCase()
      );
    });
    test("Should return 422 status code if request is sent with an invalid mode header", async () => {
      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "jjk")
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(422);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "mode must be either 'login' or 'change-password'".toLowerCase()
      );
    });
    test("Should return 422 status code if request body is invalid", async () => {
      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          emil: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(422);
      const data = res.body as {};
      expect(data.toString().toLowerCase()).toContain(
        "missing properties are: email".toLowerCase()
      );
    });
    test("Should return 201 status code and successfully create a valid OTP in the database", async () => {
      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(201);

      const otp = await OTP.findOne<OTPModelClass>({
        email: "onukwilip@gmail.com",
      });
      expect(typeof otp?.token).toBe("string");

      const otpExpireTime = new Date(otp?.expires_in as any).getTime();
      const now = new Date().getTime();

      const diff = (otpExpireTime - now) / 1000 / (60 * 60);
      expect(diff).toBeLessThanOrEqual(1);
    });
    test("Should return 201 status code and successfully overwrite an OTP in the database", async () => {
      const initialOTP = await OTP.create(
        new OTPModelClass(
          "onukwilip@gmail.com",
          await bcrypt.hash("24680", 10),
          addTimeToDate(undefined, 60 * 60)
        )
      );

      const res = await request(app)
        .post("/v1/otp/create")
        .set("Api-key", convertTobase64(apiKey))
        .set("Authorization", `Bearer ${access_token}`)
        .set("mode", "login")
        .send({
          email: "onukwilip@gmail.com",
        });

      expect(res.statusCode).toBe(201);

      const newOtp = await OTP.findOne<OTPModelClass>({
        email: "onukwilip@gmail.com",
      });
      expect(newOtp?.token).not.toEqual(initialOTP.token);
    });
  });
});
