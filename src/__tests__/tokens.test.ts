import {
  addDaysToDate,
  generateTokens,
  refreshAccessToken,
} from "./../utils/utils";
import jwt from "jsonwebtoken";
import {
  jwtSecret,
  generateAccessToken,
  generateRefreshToken,
  validateUserClaim,
  ErrorMsg,
  validateAccessToken,
} from "../utils/utils";
import * as utils from "../utils/utils";
import { RefreshTokenType, TokenDataType, TokenObjType } from "../types";
import connect from "../models/db.config";
import RefreshTokenModel from "../models/RefrestTokens";
import { config } from "dotenv";
import mongoose from "mongoose";

config();

describe("Test cases responsible for testing the access and refresh token generation algorithm", () => {
  beforeAll(async () => {
    await connect();
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  const authData = {
    user_ID: "prince2006",
    user_role: "orphanage",
  };
  const validateUserClaimSpy = jest.spyOn(utils, "validateUserClaim");

  describe("Test cases responsible for testing the 'validateUserClaim' method", () => {
    test("Should return error if invalid value is being passed to the 'data' parameter of the validateUserClaim method", () => {
      expect(() => validateUserClaim("spit" as any, [])).toThrowError(
        new TypeError("Expected a 'TokenDataType' type instead got a 'string'")
      );
      expect(() => validateUserClaim(12 as any, [])).toThrowError(
        new TypeError("Expected a 'TokenDataType' type instead got a 'number'")
      );
      expect(() => validateUserClaim(true as any, [])).toThrowError(
        new TypeError("Expected a 'TokenDataType' type instead got a 'boolean'")
      );
    });
    test("Should return error if invalid value is being passed to the 'options' parameter of the validateUserClaim method", () => {
      expect(() => validateUserClaim(authData, "" as any)).toThrowError(
        new TypeError(
          "Expected the key property to be either an array or an object, instead got a 'string'"
        )
      );
      expect(() => validateUserClaim(authData, false as any)).toThrowError(
        new TypeError(
          "Expected the key property to be either an array or an object, instead got a 'boolean'"
        )
      );
      expect(() => validateUserClaim(authData, 5 as any)).toThrowError(
        new TypeError(
          "Expected the key property to be either an array or an object, instead got a 'number'"
        )
      );
    });
    test("Should return error if invalid object is being passed to the 'data' parameter of the validateUserClaim method", () => {
      expect(() =>
        validateUserClaim({ user_ID: "prince2006" } as any, [
          "user_ID",
          "user_role",
        ])
      ).toThrowError(new Error("Expected the 'user_role' parameter"));
      expect(() =>
        validateUserClaim({ user_role: "orphanage" } as any, [
          "user_ID",
          "user_role",
        ])
      ).toThrowError(new Error("Expected the 'user_ID' parameter"));
      expect(() =>
        validateUserClaim({ any: "demo" } as any, ["user_ID", "user_role"])
      ).toThrowError(new Error("Expected the 'user_ID' parameter"));
    });
  });

  describe("Test cases responsible for testing the 'generateAccessToken' method", () => {
    test("Should validate the user claim being passed to the 'data' parameter", () => {
      try {
        generateAccessToken("spit" as any);
      } catch (e) {}

      expect(validateUserClaimSpy).toBeCalled();
    });
    test("Should return the data passed into access token when decrypted", async () => {
      const token = generateAccessToken(authData);

      const decryptedtoken = jwt.verify(token, jwtSecret) as jwt.JwtPayload &
        TokenDataType;
      expect(decryptedtoken.user_ID).toBe(authData.user_ID);
      expect(decryptedtoken.user_role).toBe(authData.user_role);
    });
  });

  describe("Test cases responsible for testing the 'validateAccessToken' method", () => {
    test("Should throw error if invalid value is passed to the token parameter", () => {
      expect(() => validateAccessToken(10 as any)).toThrowError(
        `Expected the token parameter to be a 'string', but instead got a 'number'`
      );
      expect(() => validateAccessToken(true as any)).toThrowError(
        `Expected the token parameter to be a 'string', but instead got a 'boolean'`
      );
      expect(() => validateAccessToken([] as any)).toThrowError(
        `Expected the token parameter to be a 'string', but instead got a 'object'`
      );
      expect(() => validateAccessToken({} as any)).toThrowError(
        `Expected the token parameter to be a 'string', but instead got a 'object'`
      );
    });
    test("Should return 'false' if invalid token is passed", () => {
      const tokenResponse = validateAccessToken("");
      expect(tokenResponse.status).toBe(false);
    });
    test("Should return token details if a valid token is passed", () => {
      const accessToken = generateAccessToken(authData);
      expect((validateAccessToken(accessToken) as any).decoded?.user_ID).toBe(
        authData.user_ID
      );
    });
  });

  describe("Test cases responsible for testing the 'addDaysToDate' method", () => {
    test("Should add the right number of days to the current date", () => {
      expect(
        addDaysToDate(new Date("2023/09/04").getTime(), 10).toDateString()
      ).toBe(new Date("2023/09/14").toDateString());
    });

    test("Should throw error if invalid date is specified", () => {
      expect(() => addDaysToDate("chicken" as any, 10)).toThrowError(
        new TypeError("Invalid date specified")
      );
    });

    test("Should throw error if invalid number of days is specified", () => {
      expect(() =>
        addDaysToDate(new Date("2023/09/04").getTime(), "chicken" as any)
      ).toThrowError(
        new TypeError(
          "Value passed into the 'daysToAdd' parameter is not a number"
        )
      );
    });
  });

  describe("Test cases responsible for testing the 'generateRefreshToken' method", () => {
    beforeEach(() => connect());

    test("Should validate the user claim being passed to the 'data' parameter", async () => {
      try {
        await generateRefreshToken("spit" as any);
      } catch (e) {}

      expect(validateUserClaimSpy).toBeCalled();
    });
    test("Should generate a valid refresh token", async () => {
      const refreshToken = await generateRefreshToken(authData);
      expect(typeof refreshToken).toBe("string");

      const refreshTokenData =
        await RefreshTokenModel.findOne<RefreshTokenType>({ id: refreshToken });

      expect(refreshTokenData?.id).toBe(refreshToken);
      expect(new Date(refreshTokenData?.expires_in as any).toDateString()).toBe(
        addDaysToDate(new Date().getTime(), 30).toDateString()
      );
      expect(refreshTokenData?.user_role).toBe(authData.user_role);
      expect(refreshTokenData?.user_ID).toBe(authData.user_ID);
      expect(refreshTokenData?.valid_days).toBe(30);
    });
  });

  describe("Test cases responsible for testing the 'generateTokens' method", () => {
    connect();

    test("Should validate the user claim being passed to the 'data' parameter", async () => {
      try {
        await generateTokens("spit" as any);
      } catch (e) {}

      expect(validateUserClaimSpy).toBeCalled();
    });
    test("Should return a valid access and refresh token object", async () => {
      const tokenObj = await generateTokens(authData);
      expect("accessToken" in tokenObj).toBeTruthy();
      expect("refreshToken" in tokenObj).toBeTruthy();
      expect(typeof tokenObj.accessToken).toBe("string");
      expect(typeof tokenObj.refreshToken).toBe("string");
    });
    test("Should successfully store the generated refresh token in the database", async () => {
      const tokenObj = await generateTokens(authData);

      const refreshTokenData =
        await RefreshTokenModel.findOne<RefreshTokenType>({
          id: tokenObj.refreshToken,
        });

      expect(refreshTokenData?.id).toBe(tokenObj.refreshToken);
      expect(new Date(refreshTokenData?.expires_in as any).toDateString()).toBe(
        addDaysToDate(new Date().getTime(), 30).toDateString()
      );
      expect(refreshTokenData?.user_role).toBe(authData.user_role);
      expect(refreshTokenData?.user_ID).toBe(authData.user_ID);
      expect(refreshTokenData?.valid_days).toBe(30);
    });
  });

  describe("Test cases responsible for testing the 'refreshAccessToken' method", () => {
    test("Should return a valid access and refresh token object", async () => {
      const refreshToken = await generateRefreshToken(authData);
      const tokenObj = await refreshAccessToken(refreshToken, authData.user_ID);
      expect("accessToken" in tokenObj).toBeTruthy();
      expect("refreshToken" in tokenObj).toBeTruthy();
      expect(typeof tokenObj.accessToken).toBe("string");
      expect(typeof tokenObj.refreshToken).toBe("string");
    });
    test("Should throw error if the refresh token id passed as a parameter is doesn't exist", async () => {
      expect(
        async () => await refreshAccessToken("8j", "opqr")
      ).rejects.toThrowError(
        new Error(
          JSON.stringify(
            new ErrorMsg(
              401,
              "Refresh token with ID '8j', and user ID 'opqr', doesn't exist"
            )
          )
        )
      );
    });
    test("Should successfully refresh the access token and store the generated refresh token in the database", async () => {
      const initialRefreshTokenID = await generateRefreshToken(authData);
      const initialRefreshToken = await RefreshTokenModel.findOne({
        id: initialRefreshTokenID,
      });

      const refreshedTokenObj = await refreshAccessToken(
        initialRefreshTokenID,
        authData.user_ID
      );

      const newRefreshToken = await RefreshTokenModel.findOne<RefreshTokenType>(
        {
          id: refreshedTokenObj.refreshToken,
        }
      );

      expect(newRefreshToken?.id).toBe(refreshedTokenObj.refreshToken);
      expect(newRefreshToken?.id).not.toBe(initialRefreshTokenID);
      expect(new Date(newRefreshToken?.expires_in as any).toDateString()).toBe(
        new Date(initialRefreshToken?.expires_in as any).toDateString()
      );
      expect(newRefreshToken?.user_role).toBe(authData.user_role);
      expect(newRefreshToken?.user_ID).toBe(authData.user_ID);
      expect(newRefreshToken?.valid_days).toBe(30);
    });
    test("Should throw error if the refresh token id passed as a parameter is not a valid string", async () => {
      expect(
        async () => await refreshAccessToken(10 as any, "kkn")
      ).rejects.toThrowError(
        new TypeError(
          `Expected the 'refreshToken' parameter to be a string instead got type 'number'`
        )
      );
    });
  });
});
