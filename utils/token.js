import jwt from "jsonwebtoken";

// "sub" (subject) is the standard JWT claim name for "who this token is
// about" — using it instead of a custom field name is a small convention
// that other tools/libraries expect.
export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}