import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

const router = Router();

// Computed once at startup. Used so a login attempt for a non-existent
// email takes about as long as one for a real email that got the password
// wrong — see note below.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const user = await User.create({ name, email, password }); // hashed by the model's beforeCreate hook
  const token = signToken(user.id);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  // Deliberately generic on ANY failure below (bad input, unknown email,
  // wrong password) — one message, one status code, no way to tell which
  // case happened from the outside.
  if (!parsed.success) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const { email, password } = parsed.data;

  const user = await User.scope("withPassword").findOne({ where: { email } });
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

export default router;