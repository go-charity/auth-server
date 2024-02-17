import { NextFunction, Response, Request } from "express";
import bcrypt from "bcrypt";
import {
  RefreshTokenType,
  TokenDataType,
  TokenObjType,
  UserType,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import jwt, { Jwt, VerifyErrors } from "jsonwebtoken";
import RefrestTokenModel from "../models/RefrestTokens";
import UserModel from "../models/Users";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import inspector from "schema-inspector";
import TempUserDetailsModel from "../models/TempUserDetails";

export const apiKey = "fe132312b2fb42bebb044162ef40e3ce";
export const jwtSecret = "88141db444b743a0bf17bbad8f7f2b48";
export const otpJwtSecret = "79ecc06ccddf4a68ba9b85442df62975";
export const options = {
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
  apis: ["./routes/*.js"],
};

/**
 * Converts a utf-8 string to a base64 string
 * @param value utf-8 string
 * @returns base64 string
 */
export const convertTobase64 = (value: string) =>
  Buffer.from(value).toString("base64");

/**
 * Converts a base64 string to a utf-8 string
 * @param value base64 string
 * @returns utf-8 string
 */
export const convertFrombase64 = (value: string) =>
  Buffer.from(value, "base64").toString("utf-8");

export class ErrorMsg {
  constructor(public code: number, public message: string) {}
}

export class TokenResponseClass {
  constructor(public access_token: string, public refresh_token: string) {}
}

export class RefreshTokenModelClass {
  constructor(
    public id: string,
    public user_ID: string,
    public expires_in: Date,
    public valid_days: number,
    public user_role: string
  ) {}
}

export class UserModelClass {
  constructor(
    public user_type: "orphanage" | "donor",
    public government_ID: string,
    public email: string,
    public password: string,
    public authenticated: boolean
  ) {}
}

export class TempUserModelClass {
  constructor(
    public user_ID: string,
    public user_type: string,
    public fullname: string,
    public phone_number: string,
    public tagline?: string,
    public email?: string
  ) {}
}

export class OTPModelClass {
  constructor(
    public email: string,
    public token: string,
    public expires_in: Date
  ) {}
}

/**
 * Validates the data/claim passed to the access and refresh tokens, and throws an error if parameters are not valid
 * @example validateUserClaim({user_ID: "prince2006", user_role: "donor"}, ["user_ID", "user_role"])
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param options The list of keys to validate
 * @returns void
 */
export const validateUserClaim = (
  data: TokenDataType,
  options: { keys: string[] } | string[]
): void => {
  // Validate if the parameter passed is a valid object
  if (typeof data !== "object")
    throw new TypeError(
      `Expected a 'TokenDataType' type instead got a '${typeof data}'`
    );

  const keyIterator = Array.isArray(options)
    ? options
    : typeof options === "object"
    ? options.keys
    : undefined;

  // Validate the options parameter
  if (typeof keyIterator === "undefined")
    throw new TypeError(
      `Expected the key property to be either an array or an object, instead got a '${typeof options}'`
    );

  // Loop through all specified keys
  for (const key of keyIterator) {
    // Validate if the object passed as a parameter contains the current key
    if (!Object.keys(data).includes(key)) {
      throw new Error(`Expected the '${key}' parameter`);
    }
  }
};

/**
 * Validates the properties of an object
 * @example validateObjectProperties({name: "prince", password: "123456"}, ["name", "password"])
 * @example validateObjectProperties({name: "prince", password: "123456"}, {keys: ["name", "password"], strict: true})
 * @example validateObjectProperties({name: "prince", password: "123456"}, {keys: ["name", "password"], returnMissingKeys: true})
 * @param data The object to be validated
 * @param options The list of keys to validate
 * @returns true or false or object containing the missing keys
 */
export const validateObjectProperties = (
  data: Record<any, any>,
  options:
    | { keys: string[]; strict?: boolean; returnMissingKeys?: boolean }
    | string[]
): boolean | { valid: boolean; missingKeys: string[] } => {
  let returnValue: boolean | { valid: boolean; missingKeys: string[] } =
    !Array.isArray(options) && options.returnMissingKeys === true
      ? { valid: true, missingKeys: [] }
      : true;
  const missingkeys = [];
  // Validate if the parameter passed is a valid object
  if (typeof data !== "object")
    throw new TypeError(
      `Expected an 'object' type instead got a '${typeof data}'`
    );
  // Validate if the parameter passed is an array, if it is throw an error
  if (Array.isArray(data))
    throw new TypeError(`Expected an 'object' type instead got an 'array'`);

  const keyIterator = Array.isArray(options)
    ? options
    : typeof options === "object"
    ? options.keys
    : undefined;

  // Validate the options parameter
  if (typeof keyIterator === "undefined")
    throw new TypeError(
      `Expected the key property to be either an array or an object, instead got a '${typeof options}'`
    );

  // Loop through all specified keys
  for (const key of keyIterator) {
    // Validate if the object passed as a parameter contains the current key
    if (!Object.keys(data).includes(key)) {
      // If the strict property is set to true
      if (!Array.isArray(options) && options.strict === true)
        missingkeys.push(key);

      // If the returnMissingKeys property is set to true return an object
      if (!Array.isArray(options) && options.returnMissingKeys === true) {
        if (typeof returnValue === "object") {
          returnValue.valid = false;
          Array.isArray(returnValue.missingKeys)
            ? returnValue.missingKeys.push(key)
            : (returnValue.missingKeys = []);
        } else returnValue = { valid: false, missingKeys: [key] };
      }
      // Else return a bollean
      else returnValue = false;
      console.error(`Expected the '${key}' parameter`);
    }
  }

  // If the strict property is set to true
  if (
    !Array.isArray(options) &&
    missingkeys.length > 0 &&
    options.strict === true
  )
    throw new Error(
      `Expected the ${missingkeys
        .map((key) => `'${key}'`)
        .join(", ")} parameters`
    );

  return returnValue;
};

/**
 * A function for validating the data passed to the update location endpoint
 * @param socialMediaHandles An object matching the following schema - {lat: number, lng: number}
 * @returns an object containing result of the parameter passed has the valid schema, and the error/success message
 */
export const validateRegisterEndpointBody = (
  userDetails: UserType
): {
  valid: boolean;
  format: Function;
} => {
  // If the value passed into the socialMediaHandles paremeter is not a valid object
  if (typeof userDetails !== "object")
    return {
      valid: false,
      format: () =>
        `Expected the parameter passed to the 'userDetails' parameter to ba a object, but got a '${typeof userDetails}' instead`,
    };
  if (Array.isArray(userDetails))
    return {
      valid: false,
      format: () =>
        `Expected the parameter passed to the 'userDetails' parameter to ba a object, but got an 'array' instead`,
    };

  const schema = {
    type: "object",
    properties: {
      user_type: {
        type: "string",
      },
      government_ID: {
        type: "string",
      },
      email: {
        type: "string",
      },
      password: {
        type: "string",
      },
      metadata: {
        type: "object",
        properties: {
          fullname: {
            type: "string",
          },
          phone_number: {
            type: "string",
          },
        },
      },
    },
  };

  const result = inspector.validate(schema, userDetails);

  return result;
};

/**
 * Throws a new error with a particular format
 * @param ErrorType The type of error to throw
 * @param code the code of the error
 * @param message The error message
 */
const throwError = <T extends ErrorConstructor>(
  ErrorType: T,
  code: number,
  message: string
) => {
  throw new ErrorType(JSON.stringify(new ErrorMsg(code, message)));
};

/**
 * Generates the access and refresh token for a user
 * @example generateTokens({user_ID: "prince2006", user_role: "donor"})
 * @example generateTokens({user_ID: "prince2006", user_role: "donor"}, secretKey) // Uses a different secret key for the access token
 * @example generateTokens({user_ID: "prince2006", user_role: "donor"}, secretKey, {access_token: 60 * 60}) // Adds 1 hour from now. I.e The access token will expire an hour
 * @example generateTokens({user_ID: "prince2006", user_role: "donor"}, secretKey, {refresh_token: {type: "day", amount: 10}}) // Adds 10 days from now. I.e The refresh token will expire in 10 days
 * @example generateTokens({user_ID: "prince2006", user_role: "donor"}, secretKey, {refresh_token: {type: "time", amount: 60 * 60}}) // Adds 1 hour from now. I.e The refresh token will expire an hour
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param secret The secret key used to generate the token, if undefined - the default key is used
 * @param expiresIn The timeframe for which the access or refresh token should last, if undefined - the default timeframes are used
 * @returns JWT signed access and refresh tokens
 */
export const generateTokens = async (
  data: TokenDataType,
  secret?: string,
  expires_in?: {
    access_token?: number;
    refresh_token?: { type: "time" | "day"; amount: number };
  }
): Promise<TokenObjType> => {
  const accessToken = generateAccessToken(
    data,
    secret,
    expires_in?.access_token
  );
  const refreshToken = await generateRefreshToken(
    data,
    expires_in?.refresh_token
  );
  return { accessToken, refreshToken };
};

/**
 * Generates the access token for a user
 * @example generateAccessToken({user_ID: "prince2006", user_role: "donor"})
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param secret The secret which should be used to generate an access token, if undefined - the default secret is used
 * @param expiresIn The timeframe for which the access token should last, if undefined - the default timeframe is used
 * @returns JWT signed access token
 */
export const generateAccessToken = (
  data: TokenDataType,
  secret?: string,
  expiresIn?: number
): string => {
  // Validate the 'data' parameter
  validateUserClaim(data, ["user_ID", "user_role"]);
  // generate the access token
  const access_token = jwt.sign(data, secret || jwtSecret, {
    expiresIn: expiresIn || 60 * 5,
  });
  // console.log("ACCESS TOKEN: ", access_token);
  return access_token;
};

/**
 * Validate the access token of a request
 * @example validateAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
 * @example validateAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", 'secret key')
 * @param token The token to validate
 * @param secret The secret key used to generate the token, if undefined - the default key is used
 * @returns decrypted token if valid, and false if invalid
 */
export const validateAccessToken = (
  token: string,
  secret?: string
):
  | { status: false; decoded: VerifyErrors }
  | { status: true; decoded: jwt.JwtPayload & TokenDataType } => {
  if (typeof token !== "string")
    throw new Error(
      `Expected the token parameter to be a 'string', but instead got a '${typeof token}'`
    );

  try {
    // validate the access token
    const decryptedToken = jwt.verify(
      token,
      secret || jwtSecret
    ) as jwt.JwtPayload & TokenDataType;
    return { status: true, decoded: decryptedToken };
  } catch (error: any) {
    return { status: false, decoded: { ...error } };
  }
};

/**
 * Generates the refresh token for a user, and inserts it inot the database
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"})
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"}, {type: "day", amount: 10}); // Adds 10 days from now. I.e The token will expire in 10 days
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"}, {type: "time", amount: 60 * 60}); // Adds 1 hour from now. I.e The token will expire an hour
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param expiresIn The timeframe for which the refresh token should last, if undefined - the default timeframe is used
 * @returns Refresh token ID
 */
export const generateRefreshToken = async (
  data: TokenDataType,
  expires_in?: { type: "time" | "day"; amount: number }
): Promise<string> => {
  // Validate the 'data' parameter
  validateUserClaim(data, ["user_ID", "user_role"]);

  // Generate a refresh token id
  const refreshTokenID = uuidv4().split("-").join("");
  // Create a new refresh token
  const createRefreshToken = await RefrestTokenModel.create({
    id: refreshTokenID,
    ...data,
    expires_in:
      // If the 'expires_in' parameter was not specified: let the token expire in the next 30 days
      !expires_in
        ? addDaysToDate(undefined, 30)
        : // If the 'expires_in' parameter was set and the 'type' property was set to 'time': let the token expire in the specified amount of time (in seconds) from now
        expires_in.type === "time"
        ? addTimeToDate(undefined, expires_in.amount)
        : // If the 'expires_in' parameter was set and the 'type' property was set to 'date': let the token expire in the specified amount of days from now
          addDaysToDate(undefined, expires_in.amount),
    valid_days:
      // If the 'expires_in' parameter was not specified: let the token expire in the next 30 days
      !expires_in
        ? 30
        : // If the 'expires_in' parameter was set and the 'type' property was set to 'time': let the token expire in the specified amount of time (in seconds) from now
        expires_in.type === "time"
        ? (expires_in.amount / 86400).toFixed(2)
        : // If the 'expires_in' parameter was set and the 'type' property was set to 'date': let the token expire in the specified amount of days from now
          expires_in.amount,
  });

  // If there was an error while creating the refresh token
  if (!createRefreshToken)
    throw new Error("An error occured while creating the refresh token");

  return refreshTokenID;
};

/**
 * Refreshes a user's access token
 * @example refreshAccessToken("fe132312b2fb42bebb044162ef40e3ce")
 * @param refreshTokenID The refresh token which will be used to refresh the access token
 * @param access_token.secret The secret key used to generate the token, if undefined - the default key is used
 * @param access_token.expiresIn The timeframe for which the access token should last, if undefined - the default timeframe is used
 * @returns JWT signed access token and new refresh token
 */
export const refreshAccessToken = async (
  refreshTokenID: string,
  userID: string,
  access_token?: {
    secret?: string;
    expiresIn?: number;
  }
): Promise<TokenObjType> => {
  // Calidate the 'refreshTokenID' parameter
  if (typeof refreshTokenID !== "string")
    throw new TypeError(
      `Expected the 'refreshToken' parameter to be a string instead got type '${typeof refreshTokenID}'`
    );

  // Retrieve the refreshToken
  const initialRefreshToken = await RefrestTokenModel.findOne({
    id: refreshTokenID,
    user_ID: userID,
  });

  // Throw error if refreshToken not found
  if (!initialRefreshToken)
    return throwError<ErrorConstructor>(
      Error,
      401,
      `Refresh token with ID '${refreshTokenID}', and user ID '${userID}', doesn't exist`
    );

  // Throw error if refreshToken is expired
  if (new Date(initialRefreshToken.expires_in as any) <= new Date())
    throwError<ErrorConstructor>(Error, 401, "Invalid refresh token ID");

  const data: TokenDataType = {
    user_ID: initialRefreshToken?.user_ID,
    user_role: initialRefreshToken?.user_role,
  };

  // Create new access and refresh tokens (based on the data of the previous refresh token)
  const accessToken = generateAccessToken(
    data,
    access_token?.secret,
    access_token?.expiresIn
  );
  const newRefreshTokenID = uuidv4().split("-").join("");
  const newRefreshToken = await RefrestTokenModel.create<RefreshTokenType>({
    id: newRefreshTokenID,
    ...data,
    expires_in: initialRefreshToken?.expires_in,
    valid_days: initialRefreshToken?.valid_days,
  }).catch((e) => {
    throw new Error(`Couldn't create new refresh token: ${e.message || e}`);
  });

  // Throw error if refresh token couldn't be created
  if (!newRefreshToken) throw new Error("Couldn't create new refresh token");

  // Delete the previous refreshToken
  await RefrestTokenModel.deleteMany({ id: refreshTokenID });

  return { accessToken: accessToken, refreshToken: newRefreshTokenID };
};

/**
 * Adds x number of days to a date
 * @example addDaysToDate(new Date().getTime(), 10)
 * @example addDaysToDate(10)
 * @param initialDate initial date in miliseconds
 * @param daysToAdd number of days to add
 * @returns new date
 */
export const addDaysToDate = (
  initialDate: string | Date | number | null | undefined = new Date().getTime(),
  daysToAdd: number
): Date => {
  // Check if the initialDate parameter was passed but isn't a valid date
  if (
    initialDate !== null &&
    initialDate !== undefined &&
    new Date(initialDate).toDateString() === "Invalid Date"
  )
    throw new TypeError(`Invalid date specified`);

  // Check if the daysToAdd parameter isn't a valid number
  if (typeof daysToAdd !== "number")
    throw new TypeError(
      `Value passed into the 'daysToAdd' parameter is not a number`
    );

  const currentDate = initialDate ? new Date(initialDate) : new Date();
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  return currentDate;
};

/**
 * Adds x number of days to a date
 * @example addTimeToDate(new Date().getTime(), 60 * 60)
 * @example addTimeToDate(60 * 60)
 * @param initialDate initial date in miliseconds
 * @param secondsToAdd amount of seconds to add
 * @returns new date
 */
export const addTimeToDate = (
  initialDate: string | Date | number | null | undefined = new Date().getTime(),
  secondsToAdd: number
): Date => {
  // Check if the initialDate parameter was passed but isn't a valid date
  if (
    initialDate !== null &&
    initialDate !== undefined &&
    new Date(initialDate).toDateString() === "Invalid Date"
  )
    throw new TypeError(`Invalid date specified`);

  // Check if the daysToAdd parameter isn't a valid number
  if (typeof secondsToAdd !== "number")
    throw new TypeError(
      `Value passed into the 'secondsToAdd' parameter is not a number`
    );

  const currentDate = initialDate ? new Date(initialDate) : new Date();
  currentDate.setSeconds(currentDate.getSeconds() + secondsToAdd);

  return currentDate;
};

/**
 * Creates a new user in the database if user with the provided email address doesn't exist
 * @param userDetails The details of the user to be created
 * @returns the created user
 */
export const createNewUser = async (userDetails: UserType) => {
  try {
    // Validate details
    const result = validateRegisterEndpointBody(userDetails);
    if (!result.valid) {
      throw new Error(
        `Something went wrong during user details validation: '${result.format()}'`
      );
    }

    // Search for any user with the same email address in the database
    const existingUser = await UserModel.findOne<UserType>({
      email: userDetails.email,
    });
    // If a user with the same user email address exists
    if (existingUser)
      // Throw a new error informing of the exiting user
      throwError(
        Error,
        409,
        `User with email '${userDetails.email}' already exists`
      );

    // Create the new user
    const newUser = await UserModel.create<UserType>({
      user_type: userDetails.user_type,
      government_ID:
        userDetails.user_type === "orphanage"
          ? userDetails.government_ID
          : "NULL",
      email: userDetails.email,
      password: await bcrypt.hash(convertFrombase64(userDetails.password), 10),
      authenticated: false,
    })
      // If there was an error creating the new user
      .catch((e) => {
        throw new Error(`Could not create new user: ${e.message}`);
      });

    // If there was an error creating the new user
    if (!newUser) throw new Error("Could not create new user");

    // Add the created user details to the temp user details table
    const tempUserDetails = await TempUserDetailsModel.create({
      user_type: userDetails.user_type,
      user_ID: newUser._id.toString(),
      fullname: userDetails.metadata.fullname,
      phone_number: userDetails.metadata.phone_number,
      tagline: userDetails.metadata.tagline,
      email: userDetails.email,
    })
      // If there was an error creating the user details
      .catch((e) => {
        throw new Error(`Could not create new user: ${e.message}`);
      });

    // If there was an error creating the user details
    if (!tempUserDetails) {
      // Delete the created user details
      await UserModel.deleteMany({ _id: newUser._id.toString() });
      throw new Error("Could not create new user 2");
    }

    return newUser;
  } catch (error: any) {
    await UserModel.deleteMany({ email: userDetails.email });
    await TempUserDetailsModel.deleteMany({ email: userDetails.email });
    const err = parseErrorMsg(error);
    if (typeof err === "object" && err.code === 409) {
      // Throw a new error informing of the exiting user
      throwError(Error, 409, err.message);
    }

    throw new Error(
      typeof err === "object"
        ? err.message
        : `Something went wrong: ${error.message || error}`
    );
  }
};

/**
 * Validate if a request comes with a valid api key
 * @param req The express request object
 * @param res The express response object
 * @param next The express next function
 * @returns void
 */
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!Object.keys(req.headers).includes("api-key"))
    return res.status(401).json("Invalid api key");
  if (convertFrombase64(req.headers["api-key"] as any) !== apiKey)
    return res.status(401).json("Invalid api key");

  next();
};

/**
 * Generate a random 6 digit string
 * @returns A random 6 digit string
 */
export const generateRandom6digitString = () => {
  let gen = (n: number) =>
    [...Array(n)].map((_) => (Math.random() * 10) | 0).join("");

  // TEST: generate 6 digit number
  // first number can't be zero - so we generate it separatley
  let sixDigitStr = ((1 + Math.random() * 9) | 0) + gen(5);

  return sixDigitStr;
};

/**
 * Generates a HTML email template for the OTP token
 * @param token The generated token to be sent to the user's email
 * @returns
 */
export const getOTPEmailTemplate = (token: string) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your login</title>
    <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
  </head>
  
  <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: rgba(254,195,205, 0.5);">
    <table role="presentation"
      style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
      <tbody>
        <tr>
          <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
            <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
              <tbody>
                <tr>
                  <td style="padding: 40px 0px 0px;">
                    <div style="text-align: left;">
                      <div style="padding-bottom: 20px;"><img src="https://go-charity.vercel.app/_next/static/media/logo.ffaf4ffc.png" alt="Company" style="width: 56px;"></div>
                    </div>
                    <div style="padding: 20px; background-color: rgb(255, 255, 255);">
                      <div style="color: rgb(0, 0, 0); text-align: left;">
                        <h1 style="margin: 1rem 0">Email verification code</h1>
                        <p style="padding-bottom: 16px">Please use the verification code below to sign in.</p>
                        <p style="padding-bottom: 16px"><strong style="font-size: 130%; color: #4d041c;">${token}</strong></p>
                        <p style="padding-bottom: 16px">If you didn’t request this, you can ignore this email.</p>
                        <p style="padding-bottom: 16px">Love from <br>The GO.Charity team</p>
                      </div>
                    </div>
                    
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
  
  </html>`;
};

/**
 * function responsible for sending mail to a particular email address
 * @param content The object containing the details of the email to be sent like 'from' and 'to' addresses, the email 'subject' and 'bosy'
 * @returns an array in which the first element is 'true' if the email was sent successfully and 'false' otherwise
 */
export const sendmail = async (content: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_ACCOUNT_EMAIL,
      pass: process.env.MAIL_ACCOUNT_PASSWORD,
    },
  });

  const response = await transporter.sendMail(content);

  if (response.accepted) return [true, response.response];
  else return [false, response.rejected];
};

/**
 * Parses an error obbject
 * @param e The error object
 * @returns Returns the parsed error object
 */
export const parseErrorMsg = (
  e: any
): { code: number; message: string } | string => {
  if (String(e.message).includes("code")) return JSON.parse(e.message);
  else return e.message;
};

/**
 * Function responsible for generating and setting the User OTP access and refresh tokens
 * @param user The user object consisting of the following parameterd '_id', 'user_type', 'user_role', 'user_ID'
 * @param res The express response object
 */
export const setOTPTokens = async (
  res: Response,
  tokens?: TokenObjType,
  user?: {
    user_ID: string;
    user_role: string;
    mode: "login" | "change-password";
  }
): Promise<TokenObjType> => {
  // * Validate the 'tokens' parameter
  // If the parameter is not undefined and is not an object
  if (typeof tokens !== "undefined" && typeof tokens !== "object") {
    throw new Error(
      `Expected the data passed into the 'tokens' parameter to be an 'object', but instead got a '${typeof tokens}'`
    );
  }
  // If the parameter is not undefined and is an array
  if (typeof tokens !== "undefined" && Array.isArray(tokens)) {
    throw new Error(
      `Expected the data passed into the 'tokens' parameter to be an 'object', but instead got an 'array'`
    );
  }

  // * Validate the 'user' parameter
  // If the parameter is not undefined and is not an object
  if (typeof user !== "undefined" && typeof user !== "object") {
    throw new Error(
      `Expected the data passed into the 'user' parameter to be an 'object', but instead got a '${typeof tokens}'`
    );
  }
  // If the parameter is not undefined and is an array
  if (typeof user !== "undefined" && Array.isArray(user)) {
    throw new Error(
      `Expected the data passed into the 'user' parameter to be an 'object', but instead got an 'array'`
    );
  }

  let tokenObj = typeof tokens === "object" ? { ...tokens } : undefined;

  if (!tokenObj && !user) {
    throw new Error(
      "Either the 'user' is specified or the 'tokens' is specified. Both cannot be 'undefined'"
    );
  }

  if (!tokenObj) {
    // sign otp access and refresh tokens
    tokenObj = await generateTokens(user as any, otpJwtSecret, {
      refresh_token: { type: "time", amount: 60 * 60 },
    });
  }

  // Set the access token to the response cookies
  res.cookie("otp_access_token", tokenObj.accessToken, {
    path: "/v1/otp",
    domain: process.env.API_DOMAIN,
    httpOnly: true,
    secure: true,
  });
  // Set the refresh token to the response cookies
  res.cookie("otp_refresh_token", tokenObj.refreshToken, {
    path: "/v1/otp",
    domain: process.env.API_DOMAIN,
    httpOnly: true,
    secure: true,
  });

  return tokenObj;
};

export const setAccountTokens = async (
  res: Response,
  tokens?: TokenObjType,
  tokenData?: TokenDataType
) => {
  // * Validate the 'tokens' parameter
  // If the parameter is not undefined and is not an object
  if (typeof tokens !== "undefined" && typeof tokens !== "object") {
    throw new Error(
      `Expected the data passed into the 'tokens' parameter to be an 'object', but instead got a '${typeof tokens}'`
    );
  }
  // If the parameter is not undefined and is an array
  if (typeof tokens !== "undefined" && Array.isArray(tokens)) {
    throw new Error(
      `Expected the data passed into the 'tokens' parameter to be an 'object', but instead got an 'array'`
    );
  }

  // * Validate the 'tokenData' parameter
  // If the parameter is not undefined and is not an object
  if (typeof tokenData !== "undefined" && typeof tokenData !== "object") {
    throw new Error(
      `Expected the data passed into the 'tokenData' parameter to be an 'object', but instead got a '${typeof tokens}'`
    );
  }
  // If the parameter is not undefined and is an array
  if (typeof tokenData !== "undefined" && Array.isArray(tokenData)) {
    throw new Error(
      `Expected the data passed into the 'tokenData' parameter to be an 'object', but instead got an 'array'`
    );
  }

  let tokenObj = typeof tokens === "object" ? { ...tokens } : undefined;

  if (!tokenObj && !tokenData) {
    throw new Error(
      "Either the 'tokenObj' is specified or the 'tokenData' is specified. Both cannot be 'undefined'"
    );
  }

  if (!tokenObj) {
    tokenObj = await generateTokens(tokenData as any);
  }

  // Set the access and refresh tokens as cookies
  res.cookie("access_token", tokenObj.accessToken, {
    path: "/",
    domain: process.env.API_DOMAIN,
    httpOnly: true,
    secure: true,
  });
  res.cookie("refresh_token", tokenObj.refreshToken, {
    path: "/",
    domain: process.env.API_DOMAIN,
    httpOnly: true,
    secure: true,
  });
};
