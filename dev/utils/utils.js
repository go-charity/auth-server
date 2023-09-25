"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseErrorMsg = exports.sendmail = exports.getOTPEmailTemplate = exports.generateRandom6digitString = exports.validateApiKey = exports.createNewUser = exports.addTimeToDate = exports.addDaysToDate = exports.refreshAccessToken = exports.generateRefreshToken = exports.validateAccessToken = exports.generateAccessToken = exports.generateTokens = exports.validateObjectProperties = exports.validateUserClaim = exports.OTPModelClass = exports.UserModelClass = exports.RefreshTokenModelClass = exports.TokenResponseClass = exports.ErrorMsg = exports.convertFrombase64 = exports.convertTobase64 = exports.otpJwtSecret = exports.jwtSecret = exports.apiKey = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const RefrestTokens_1 = __importDefault(require("../models/RefrestTokens"));
const Users_1 = __importDefault(require("../models/Users"));
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.apiKey = "fe132312b2fb42bebb044162ef40e3ce";
exports.jwtSecret = "88141db444b743a0bf17bbad8f7f2b48";
exports.otpJwtSecret = "79ecc06ccddf4a68ba9b85442df62975";
/**
 * Converts a utf-8 string to a base64 string
 * @param value utf-8 string
 * @returns base64 string
 */
const convertTobase64 = (value) => Buffer.from(value).toString("base64");
exports.convertTobase64 = convertTobase64;
/**
 * Converts a base64 string to a utf-8 string
 * @param value base64 string
 * @returns utf-8 string
 */
const convertFrombase64 = (value) => Buffer.from(value, "base64").toString("utf-8");
exports.convertFrombase64 = convertFrombase64;
class ErrorMsg {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}
exports.ErrorMsg = ErrorMsg;
class TokenResponseClass {
    constructor(access_token, refresh_token) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }
}
exports.TokenResponseClass = TokenResponseClass;
class RefreshTokenModelClass {
    constructor(id, user_ID, expires_in, valid_days, user_role) {
        this.id = id;
        this.user_ID = user_ID;
        this.expires_in = expires_in;
        this.valid_days = valid_days;
        this.user_role = user_role;
    }
}
exports.RefreshTokenModelClass = RefreshTokenModelClass;
class UserModelClass {
    constructor(user_type, government_ID, email, password, authenticated) {
        this.user_type = user_type;
        this.government_ID = government_ID;
        this.email = email;
        this.password = password;
        this.authenticated = authenticated;
    }
}
exports.UserModelClass = UserModelClass;
class OTPModelClass {
    constructor(email, token, expires_in) {
        this.email = email;
        this.token = token;
        this.expires_in = expires_in;
    }
}
exports.OTPModelClass = OTPModelClass;
/**
 * Validates the data/claim passed to the access and refresh tokens, and throws an error if parameters are not valid
 * @example validateUserClaim({user_ID: "prince2006", user_role: "donor"}, ["user_ID", "user_role"])
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param options The list of keys to validate
 * @returns void
 */
const validateUserClaim = (data, options) => {
    // Validate if the parameter passed is a valid object
    if (typeof data !== "object")
        throw new TypeError(`Expected a 'TokenDataType' type instead got a '${typeof data}'`);
    const keyIterator = Array.isArray(options)
        ? options
        : typeof options === "object"
            ? options.keys
            : undefined;
    // Validate the options parameter
    if (typeof keyIterator === "undefined")
        throw new TypeError(`Expected the key property to be either an array or an object, instead got a '${typeof options}'`);
    // Loop through all specified keys
    for (const key of keyIterator) {
        // Validate if the object passed as a parameter contains the current key
        if (!Object.keys(data).includes(key)) {
            throw new Error(`Expected the '${key}' parameter`);
        }
    }
};
exports.validateUserClaim = validateUserClaim;
/**
 * Validates the properties of an object
 * @example validateObjectProperties({name: "prince", password: "123456"}, ["name", "password"])
 * @example validateObjectProperties({name: "prince", password: "123456"}, {keys: ["name", "password"], strict: true})
 * @example validateObjectProperties({name: "prince", password: "123456"}, {keys: ["name", "password"], returnMissingKeys: true})
 * @param data The object to be validated
 * @param options The list of keys to validate
 * @returns true or false or object containing the missing keys
 */
const validateObjectProperties = (data, options) => {
    let returnValue = !Array.isArray(options) && options.returnMissingKeys === true
        ? { valid: true, missingKeys: [] }
        : true;
    const missingkeys = [];
    // Validate if the parameter passed is a valid object
    if (typeof data !== "object")
        throw new TypeError(`Expected an 'object' type instead got a '${typeof data}'`);
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
        throw new TypeError(`Expected the key property to be either an array or an object, instead got a '${typeof options}'`);
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
                }
                else
                    returnValue = { valid: false, missingKeys: [key] };
            }
            // Else return a bollean
            else
                returnValue = false;
            console.error(`Expected the '${key}' parameter`);
        }
    }
    // If the strict property is set to true
    if (!Array.isArray(options) &&
        missingkeys.length > 0 &&
        options.strict === true)
        throw new Error(`Expected the ${missingkeys
            .map((key) => `'${key}'`)
            .join(", ")} parameters`);
    return returnValue;
};
exports.validateObjectProperties = validateObjectProperties;
/**
 * Throws a new error with a particular format
 * @param ErrorType The type of error to throw
 * @param code the code of the error
 * @param message The error message
 */
const throwError = (ErrorType, code, message) => {
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
const generateTokens = (data, secret, expires_in) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = (0, exports.generateAccessToken)(data, secret, expires_in === null || expires_in === void 0 ? void 0 : expires_in.access_token);
    const refreshToken = yield (0, exports.generateRefreshToken)(data, expires_in === null || expires_in === void 0 ? void 0 : expires_in.refresh_token);
    return { accessToken, refreshToken };
});
exports.generateTokens = generateTokens;
/**
 * Generates the access token for a user
 * @example generateAccessToken({user_ID: "prince2006", user_role: "donor"})
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param secret The secret which should be used to generate an access token, if undefined - the default secret is used
 * @param expiresIn The timeframe for which the access token should last, if undefined - the default timeframe is used
 * @returns JWT signed access token
 */
const generateAccessToken = (data, secret, expiresIn) => {
    // Validate the 'data' parameter
    (0, exports.validateUserClaim)(data, ["user_ID", "user_role"]);
    // generate the access token
    const access_token = jsonwebtoken_1.default.sign(data, secret || exports.jwtSecret, {
        expiresIn: expiresIn || 60 * 5,
    });
    // console.log("ACCESS TOKEN: ", access_token);
    return access_token;
};
exports.generateAccessToken = generateAccessToken;
/**
 * Validate the access token of a request
 * @example validateAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
 * @example validateAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", 'secret key')
 * @param token The token to validate
 * @param secret The secret key used to generate the token, if undefined - the default key is used
 * @returns decrypted token if valid, and false if invalid
 */
const validateAccessToken = (token, secret) => {
    if (typeof token !== "string")
        throw new Error(`Expected the token parameter to be a 'string', but instead got a '${typeof token}'`);
    try {
        // validate the access token
        const decryptedToken = jsonwebtoken_1.default.verify(token, secret || exports.jwtSecret);
        return decryptedToken;
    }
    catch (error) {
        return false;
    }
};
exports.validateAccessToken = validateAccessToken;
/**
 * Generates the refresh token for a user, and inserts it inot the database
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"})
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"}, {type: "day", amount: 10}); // Adds 10 days from now. I.e The token will expire in 10 days
 * @example generateRefreshToken({user_ID: "prince2006", user_role: "donor"}, {type: "time", amount: 60 * 60}); // Adds 1 hour from now. I.e The token will expire an hour
 * @param data {user_ID: String, user_role: String} | user_ID: The ID of the user | user_role: The role of the user e.g orphanage/donor
 * @param expiresIn The timeframe for which the refresh token should last, if undefined - the default timeframe is used
 * @returns Refresh token ID
 */
const generateRefreshToken = (data, expires_in) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate the 'data' parameter
    (0, exports.validateUserClaim)(data, ["user_ID", "user_role"]);
    // Generate a refresh token id
    const refreshTokenID = (0, uuid_1.v4)().split("-").join("");
    // Create a new refresh token
    const createRefreshToken = yield RefrestTokens_1.default.create(Object.assign(Object.assign({ id: refreshTokenID }, data), { expires_in: 
        // If the 'expires_in' parameter was not specified: let the token expire in the next 30 days
        !expires_in
            ? (0, exports.addDaysToDate)(undefined, 30)
            : // If the 'expires_in' parameter was set and the 'type' property was set to 'time': let the token expire in the specified amount of time (in seconds) from now
                expires_in.type === "time"
                    ? (0, exports.addTimeToDate)(undefined, expires_in.amount)
                    : // If the 'expires_in' parameter was set and the 'type' property was set to 'date': let the token expire in the specified amount of days from now
                        (0, exports.addDaysToDate)(undefined, expires_in.amount), valid_days: 
        // If the 'expires_in' parameter was not specified: let the token expire in the next 30 days
        !expires_in
            ? 30
            : // If the 'expires_in' parameter was set and the 'type' property was set to 'time': let the token expire in the specified amount of time (in seconds) from now
                expires_in.type === "time"
                    ? (expires_in.amount / 86400).toFixed(2)
                    : // If the 'expires_in' parameter was set and the 'type' property was set to 'date': let the token expire in the specified amount of days from now
                        expires_in.amount }));
    // If there was an error while creating the refresh token
    if (!createRefreshToken)
        throw new Error("An error occured while creating the refresh token");
    return refreshTokenID;
});
exports.generateRefreshToken = generateRefreshToken;
/**
 * Refreshes a user's access token
 * @example refreshAccessToken("fe132312b2fb42bebb044162ef40e3ce")
 * @param refreshTokenID The refresh token which will be used to refresh the access token
 * @param access_token.secret The secret key used to generate the token, if undefined - the default key is used
 * @param access_token.expiresIn The timeframe for which the access token should last, if undefined - the default timeframe is used
 * @returns JWT signed access token and new refresh token
 */
const refreshAccessToken = (refreshTokenID, access_token) => __awaiter(void 0, void 0, void 0, function* () {
    // Calidate the 'refreshTokenID' parameter
    if (typeof refreshTokenID !== "string")
        throw new TypeError(`Expected the 'refreshToken' parameter to be a string instead got type '${typeof refreshTokenID}'`);
    // Retrieve the refreshToken
    const initialRefreshToken = yield RefrestTokens_1.default.findOne({ id: refreshTokenID });
    // Throw error if refreshToken not found
    if (!initialRefreshToken)
        return throwError(Error, 401, `Refresh token with ID '${refreshTokenID}', doesn't exist`);
    // Throw error if refreshToken is expired
    if (new Date(initialRefreshToken.expires_in) <= new Date())
        throwError(Error, 401, "Invalid refresh token ID");
    // Delete the previous refreshToken
    yield RefrestTokens_1.default.deleteMany({ id: refreshTokenID });
    const data = {
        user_ID: initialRefreshToken === null || initialRefreshToken === void 0 ? void 0 : initialRefreshToken.user_ID,
        user_role: initialRefreshToken === null || initialRefreshToken === void 0 ? void 0 : initialRefreshToken.user_role,
    };
    // Create new access and refresh tokens (based on the data of the previous refresh token)
    const accessToken = (0, exports.generateAccessToken)(data, access_token === null || access_token === void 0 ? void 0 : access_token.secret, access_token === null || access_token === void 0 ? void 0 : access_token.expiresIn);
    const newRefreshTokenID = (0, uuid_1.v4)().split("-").join("");
    const newRefreshToken = yield RefrestTokens_1.default.create(Object.assign(Object.assign({ id: newRefreshTokenID }, data), { expires_in: initialRefreshToken === null || initialRefreshToken === void 0 ? void 0 : initialRefreshToken.expires_in, valid_days: initialRefreshToken === null || initialRefreshToken === void 0 ? void 0 : initialRefreshToken.valid_days }));
    // Throw error if refresh token couldn't be created
    if (!newRefreshToken)
        throw new Error("Could't create new refresh token");
    return { accessToken: accessToken, refreshToken: newRefreshTokenID };
});
exports.refreshAccessToken = refreshAccessToken;
/**
 * Adds x number of days to a date
 * @example addDaysToDate(new Date().getTime(), 10)
 * @example addDaysToDate(10)
 * @param initialDate initial date in miliseconds
 * @param daysToAdd number of days to add
 * @returns new date
 */
const addDaysToDate = (initialDate = new Date().getTime(), daysToAdd) => {
    // Check if the initialDate parameter was passed but isn't a valid date
    if (initialDate !== null &&
        initialDate !== undefined &&
        new Date(initialDate).toDateString() === "Invalid Date")
        throw new TypeError(`Invalid date specified`);
    // Check if the daysToAdd parameter isn't a valid number
    if (typeof daysToAdd !== "number")
        throw new TypeError(`Value passed into the 'daysToAdd' parameter is not a number`);
    const currentDate = initialDate ? new Date(initialDate) : new Date();
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    return currentDate;
};
exports.addDaysToDate = addDaysToDate;
/**
 * Adds x number of days to a date
 * @example addTimeToDate(new Date().getTime(), 60 * 60)
 * @example addTimeToDate(60 * 60)
 * @param initialDate initial date in miliseconds
 * @param secondsToAdd amount of seconds to add
 * @returns new date
 */
const addTimeToDate = (initialDate = new Date().getTime(), secondsToAdd) => {
    // Check if the initialDate parameter was passed but isn't a valid date
    if (initialDate !== null &&
        initialDate !== undefined &&
        new Date(initialDate).toDateString() === "Invalid Date")
        throw new TypeError(`Invalid date specified`);
    // Check if the daysToAdd parameter isn't a valid number
    if (typeof secondsToAdd !== "number")
        throw new TypeError(`Value passed into the 'secondsToAdd' parameter is not a number`);
    const currentDate = initialDate ? new Date(initialDate) : new Date();
    currentDate.setSeconds(currentDate.getSeconds() + secondsToAdd);
    return currentDate;
};
exports.addTimeToDate = addTimeToDate;
/**
 * Creates a new user in the database if user with the provided email address doesn't exist
 * @param userDetails The details of the user to be created
 * @returns the created user
 */
const createNewUser = (userDetails) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate details
    (0, exports.validateObjectProperties)(userDetails, {
        keys: ["user_type", "government_ID", "email", "password"],
        strict: true,
        returnMissingKeys: true,
    });
    const existingUser = yield Users_1.default.findOne({
        email: userDetails.email,
    });
    if (existingUser)
        throwError(Error, 409, `User with email '${userDetails.email}' already exists`);
    const newUser = yield Users_1.default.create({
        user_type: userDetails.user_type,
        government_ID: userDetails.user_type === "orphanage"
            ? userDetails.government_ID
            : "NULL",
        email: userDetails.email,
        password: yield bcrypt_1.default.hash((0, exports.convertFrombase64)(userDetails.password), 10),
        authenticated: false,
    });
    if (!newUser)
        throw new Error("Could not create new user");
    return newUser;
});
exports.createNewUser = createNewUser;
/**
 * Validate if a request comes with a valid api key
 * @param req The express request object
 * @param res The express response object
 * @param next The express next function
 * @returns void
 */
const validateApiKey = (req, res, next) => {
    if (!Object.keys(req.headers).includes("api-key"))
        return res.status(401).json("Invalid api key");
    if ((0, exports.convertFrombase64)(req.headers["api-key"]) !== exports.apiKey)
        return res.status(401).json("Invalid api key");
    next();
};
exports.validateApiKey = validateApiKey;
/**
 * Generate a random 6 digit string
 * @returns A random 6 digit string
 */
const generateRandom6digitString = () => {
    let gen = (n) => [...Array(n)].map((_) => (Math.random() * 10) | 0).join("");
    // TEST: generate 6 digit number
    // first number can't be zero - so we generate it separatley
    let sixDigitStr = ((1 + Math.random() * 9) | 0) + gen(5);
    return sixDigitStr;
};
exports.generateRandom6digitString = generateRandom6digitString;
/**
 * Generates a HTML email template for the OTP token
 * @param token The generated token to be sent to the user's email
 * @returns
 */
const getOTPEmailTemplate = (token) => {
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
exports.getOTPEmailTemplate = getOTPEmailTemplate;
/**
 * function responsible for sending mail to a particular email address
 * @param content The object containing the details of the email to be sent like 'from' and 'to' addresses, the email 'subject' and 'bosy'
 * @returns an array in which the first element is 'true' if the email was sent successfully and 'false' otherwise
 */
const sendmail = (content) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_ACCOUNT_EMAIL,
            pass: process.env.MAIL_ACCOUNT_PASSWORD,
        },
    });
    const response = yield transporter.sendMail(content);
    if (response.accepted)
        return [true, response.response];
    else
        return [false, response.rejected];
});
exports.sendmail = sendmail;
/**
 * Parses an error obbject
 * @param e The error object
 * @returns Returns the parsed error object
 */
const parseErrorMsg = (e) => {
    if (String(e.message).includes("code"))
        return JSON.parse(e.message);
    else
        return e.message;
};
exports.parseErrorMsg = parseErrorMsg;
