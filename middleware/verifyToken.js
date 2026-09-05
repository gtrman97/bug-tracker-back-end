import jwt from "jsonwebtoken";

// AUTHENTICATION only: "who is this user?"
// On success, sets req.user = { id }. Does not look at roles, projects,
// or permissions — that is requireRole's job, in a separate file, on
// purpose. Business logic (routes) should never need to know a JWT was
// even involved; they just read req.user.
export default function verifyToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}