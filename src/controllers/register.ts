import { Request, Response } from "express";
import { createNewUser, validateObjectProperties } from "../utils/utils";
import { UserType } from "../types";

export const registerUser = async (
  req: Request<any, any, UserType>,
  res: Response
) => {
  // Validate the body being passed to the request
  const result = validateObjectProperties(req.body, {
    keys: ["user_type", "government_ID", "email", "password"],
    strict: false,
    returnMissingKeys: true,
  });
  if (!result || (typeof result === "object" && !result.valid)) {
    return res
      .status(400)
      .json(
        `Invalid body passed. ${
          typeof result === "object"
            ? `Missing properties are: ${result.missingKeys.join(", ")}`
            : ""
        }`
      );
  }

  try {
    await createNewUser(req.body);
    return res.status(201).json(`User created successfully`);
  } catch (e: any) {
    console.log("ERROR MSG: ", e.message);
    // If the user already exists
    if (
      String(e.message).includes("code") &&
      JSON.parse(e.message)?.code === 409
    )
      return res
        .status(409)
        .json(`User with email '${req.body.email}' already exists`);

    return res.status(500).json(`Something went wrong`);
  }
};
