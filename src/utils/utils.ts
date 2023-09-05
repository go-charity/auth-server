import { NextFunction, Response, Request } from "express";
import bcrypt from "bcrypt";
import {
  RefreshTokenType,
  TokenDataType,
  TokenObjType,
  UserType,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import RefrestTokenModel from "../models/RefrestTokens";
import UserModel from "../models/Users";

export const apiKey = "fe132312b2fb42bebb044162ef40e3ce";
export const jwtSecret = "88141db444b743a0bf17bbad8f7f2b48";

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

// /**
//  *
//  * @param body Consists of the response body to validate, the keys to validate and the response object
//  * @returns
//  */
// export const validateRequestBody = ({
//   data,
//   keys,
//   response,
// }: {
//   data: Record<any, any>;
//   keys: string[];
//   response: Response;
// }) => {
//   // Validate the body being passed to the request
//   const result = validateObjectProperties(data, {
//     keys: keys,
//     strict: false,
//     returnMissingKeys: true,
//   });
//   if (!result || (typeof result === "object" && !result.valid)) {
//     return response
//       .status(400)
//       .json(
//         `Invalid body passed. ${
//           Array.isArray(result)
//             ? `Missing properties are: ${result.join(", ")}`
//             : ""
//         }`
//       );
//   }
// };

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
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @returns JWT signed access and refresh tokens
 */
export const generateTokens = async (
  data: TokenDataType
): Promise<TokenObjType> => {
  const accessToken = generateAccessToken(data);
  const refreshToken = await generateRefreshToken(data);
  return { accessToken, refreshToken };
};

/**
 * Generates the access token for a user
 * @example generateAccessToken({user_ID: "prince2006", user_role: "donor"})
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @returns JWT signed access token
 */
export const generateAccessToken = (data: TokenDataType): string => {
  // Validate the 'data' parameter
  validateUserClaim(data, ["user_ID", "user_role"]);
  // generate the access token
  const access_token = jwt.sign(data, jwtSecret, { expiresIn: 60 * 5 });
  // console.log("ACCESS TOKEN: ", access_token);
  return access_token;
};

/**
 * Validate the access token of a request
 * @example validateAccessToken(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c)
 * @param token The token to validate
 * @returns true if valid, and false if invalid
 */
export const validateAccessToken = (token: string): boolean => {
  if (typeof token !== "string")
    throw new Error(
      `Expected the token parameter to be a 'string', but instead got a '${typeof token}'`
    );

  try {
    // validate the access token
    jwt.verify(token, jwtSecret);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Generates the refresh token for a user, and inserts it inot the database
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"})
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @returns Refresh token ID
 */
export const generateRefreshToken = async (
  data: TokenDataType
): Promise<string> => {
  // Validate the 'data' parameter
  validateUserClaim(data, ["user_ID", "user_role"]);

  const refreshTokenID = uuidv4().split("-").join("");
  const createRefreshToken = await RefrestTokenModel.create<RefreshTokenType>({
    id: refreshTokenID,
    ...data,
    expires_in: addDaysToDate(undefined, 30),
    valid_days: 30,
  });

  if (!createRefreshToken)
    throw new Error("An error occured while creating the refresh token");

  return refreshTokenID;
};

/**
 * Generates the access token for a userRefreshes a user's access token
 * @example refreshAccessToken({user_ID: "prince2006", user_role: "donor"})
 * @param refreshTokenID The refresh token which will be used to refresh the access token
 * @returns JWT signed access token and new refresh token
 */
export const refreshAccessToken = async (
  refreshTokenID: string
): Promise<TokenObjType> => {
  // Calidate the 'refreshTokenID' parameter
  if (typeof refreshTokenID !== "string")
    throw new TypeError(
      `Expected the 'refreshToken' parameter to be a string instead got type '${typeof refreshTokenID}'`
    );

  // Retrieve the refreshToken
  const initialRefreshToken = await RefrestTokenModel.findOne<RefreshTokenType>(
    { id: refreshTokenID }
  );

  // Throw error if refreshToken not found
  if (!initialRefreshToken)
    return throwError<ErrorConstructor>(
      Error,
      401,
      `Refresh token with ID '${refreshTokenID}', doesn't exist`
    );

  // Throw error if refreshToken is expired
  if (new Date(initialRefreshToken.expires_in) <= new Date())
    throwError<ErrorConstructor>(Error, 401, "Invalid refresh token ID");

  // Delete the previous refreshToken
  await RefrestTokenModel.deleteMany({ id: refreshTokenID });

  const data: TokenDataType = {
    user_ID: initialRefreshToken?.user_ID,
    user_role: initialRefreshToken?.user_role,
  };

  // Create new access and refresh tokens (based on the data of the previous refresh token)
  const accessToken = generateAccessToken(data);
  const newRefreshTokenID = uuidv4().split("-").join("");
  const newRefreshToken = await RefrestTokenModel.create<RefreshTokenType>({
    id: newRefreshTokenID,
    ...data,
    expires_in: initialRefreshToken?.expires_in,
    valid_days: 30,
  });

  // Throw error if refresh token couldn't be created
  if (!newRefreshToken) throw new Error("Could't create new refresh token");

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
 * Creates a new user in the database if user with the provided email address doesn't exist
 * @param userDetails The details of the user to be created
 * @returns the created user
 */
export const createNewUser = async (userDetails: {
  user_type: "orphanage" | "donor";
  government_ID: string;
  email: string;
  password: string;
}) => {
  // Validate details
  validateObjectProperties(userDetails, {
    keys: ["user_type", "government_ID", "email", "password"],
    strict: true,
    returnMissingKeys: true,
  });

  const existingUser = await UserModel.findOne<UserType>({
    email: userDetails.email,
  });
  if (existingUser)
    throwError(
      Error,
      409,
      `User with email '${userDetails.email}' already exists`
    );

  const newUser = await UserModel.create<UserType>({
    user_type: userDetails.user_type,
    government_ID:
      userDetails.user_type === "orphanage"
        ? userDetails.government_ID
        : undefined,
    email: userDetails.email,
    password: await bcrypt.hash(convertFrombase64(userDetails.password), 10),
    authenticated: false,
  });

  if (!newUser) throw new Error("Could not create new user");

  return newUser;
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
