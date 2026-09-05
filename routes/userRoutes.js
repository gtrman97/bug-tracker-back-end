import { Router } from "express";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";

const router = Router();
router.use(verifyToken);

// Needed for things like "pick an assignee" or "add a member" dropdowns.
// Password is already excluded by User's defaultScope.
router.get("/", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

export default router;