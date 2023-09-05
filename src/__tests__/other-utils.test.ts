import { validateObjectProperties } from "../utils/utils";

describe("Tests responsibe for testing other utility functions", () => {
  describe("Tests cases for validating the 'validateObjectProperties' function", () => {
    test("Should return error if invalid value is being passed to the 'data' parameter of the validateObjectProperties method", () => {
      expect(() => validateObjectProperties("spit" as any, [])).toThrowError(
        new TypeError("Expected an 'object' type instead got a 'string'")
      );
      expect(() => validateObjectProperties(12 as any, [])).toThrowError(
        new TypeError("Expected an 'object' type instead got a 'number'")
      );
      expect(() => validateObjectProperties(true as any, [])).toThrowError(
        new TypeError("Expected an 'object' type instead got a 'boolean'")
      );
      expect(() => validateObjectProperties([], [])).toThrowError(
        new TypeError("Expected an 'object' type instead got an 'array'")
      );
    });
    test("Should return error if invalid value is being passed to the 'options' parameter of the validateObjectProperties method", () => {
      expect(() => validateObjectProperties({}, "" as any)).toThrowError(
        new TypeError(
          "Expected the key property to be either an array or an object, instead got a 'string'"
        )
      );
      expect(() => validateObjectProperties({}, false as any)).toThrowError(
        new TypeError(
          "Expected the key property to be either an array or an object, instead got a 'boolean'"
        )
      );
      expect(() => validateObjectProperties({}, 5 as any)).toThrowError(
        new TypeError(
          "Expected the key property to be either an array or an object, instead got a 'number'"
        )
      );
    });
    test("Should return a boolean if the 'returnMissingKeys' property is not set", () => {
      expect(typeof validateObjectProperties({ name: "Prince" }, ["age"])).toBe(
        "boolean"
      );
    });
    test("Should return an object if the 'returnMissingKeys' property is set", () => {
      expect(
        typeof validateObjectProperties(
          { name: "Prince" },
          { keys: ["age"], strict: false, returnMissingKeys: true }
        )
      ).toBe("object");
    });
    test("Should return false if the object doesn't contain all passed parameters and the 'returnMissingKeys' property is not set", () => {
      expect(validateObjectProperties({ name: "Prince" }, ["age"])).toBe(false);
    });
    test("Should return true if the object contains all passed parameters and the 'returnMissingKeys' property is not set", () => {
      expect(validateObjectProperties({ name: "Prince" }, ["name"])).toBe(true);
    });
    test("Should return an object with the 'valid' property set to 'false' if the passed object doesn't contain all passed parameters and the 'returnMissingKeys' property is set", () => {
      const result = validateObjectProperties(
        { name: "Prince" },
        { keys: ["age"], returnMissingKeys: true }
      );
      expect((result as any).valid).toBe(false);
    });
    test("Should return an object with the 'valid' property set to 'true' if the passed object contains all passed parameters and the 'returnMissingKeys' property is set", () => {
      const result = validateObjectProperties(
        { name: "Prince" },
        { keys: ["name"], returnMissingKeys: true }
      );
      expect((result as any).valid).toBe(true);
    });
    test("Should return an object with the 'missingKeys' property set to the right value (should contain all missing keys) if the passed object doesn't contain all passed parameters and the 'returnMissingKeys' property is set", () => {
      const result = validateObjectProperties(
        { name: "Prince", email: "onukwilip@gmail.com" },
        { keys: ["age", "dob", "height", "email"], returnMissingKeys: true }
      );
      expect((result as any).missingKeys).toContain("age");
      expect((result as any).missingKeys).toContain("dob");
      expect((result as any).missingKeys).toContain("height");
      expect((result as any).missingKeys).not.toContain("email");
    });
    test("Should return an object with the 'missingKeys' property set to the right value (should not contain non-missing keys) if the passed object doesn't contain all passed parameters and the 'returnMissingKeys' property is set", () => {
      const result = validateObjectProperties(
        { name: "Prince", email: "onukwilip@gmail.com" },
        { keys: ["age", "dob", "height", "email"], returnMissingKeys: true }
      );

      expect((result as any).missingKeys).not.toContain("email");
    });
    test("Should throw error if the passed object doesn't contain all passed parameters and the 'strict' property is set", () => {
      expect(() =>
        validateObjectProperties(
          { name: "Prince", email: "onukwilip@gmail.com" },
          { keys: ["age", "dob", "height", "email"], strict: true }
        )
      ).toThrowError(
        new Error(`Expected the 'age', 'dob', 'height' parameters`)
      );
    });
    test("Should not throw error if the passed object contains all passed parameters and the 'strict' property is set", () => {
      expect(() =>
        validateObjectProperties(
          { name: "Prince", email: "onukwilip@gmail.com" },
          { keys: ["name", "email"], strict: true }
        )
      ).not.toThrowError();
    });
    test("Should throw error if the passed object doesn't contain all passed parameters, the 'strict' property is set and the 'returnMissingKeys' property is set", () => {
      expect(() =>
        validateObjectProperties(
          { name: "Prince", email: "onukwilip@gmail.com" },
          {
            keys: ["age", "grade", "height", "email"],
            strict: true,
            returnMissingKeys: true,
          }
        )
      ).toThrowError(
        new Error(`Expected the 'age', 'grade', 'height' parameters`)
      );
    });
  });
});
