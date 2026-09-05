import { Router } from "express";
import { z } from "zod";
import Project from "../models/Project.js";
import ProjectMembership from "../models/ProjectMembership.js";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";
import requireRole from "../middleware/requireRole.js";

const router = Router();
router.use(verifyToken); // every project route requires a logged-in user

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().trim().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const project = await Project.create({ ...parsed.data, ownerId: req.user.id });

  // The creator becomes an admin member immediately. Ownership (the
  // ownerId field) and permission (the membership row) are tracked
  // separately, but every new project needs at least one admin or no one
  // could ever manage it.
  await ProjectMembership.create({ userId: req.user.id, projectId: project.id, role: "admin" });

  res.status(201).json(project);
});

// Projects the logged-in user belongs to, with their role on each.
router.get("/", async (req, res) => {
  const memberships = await ProjectMembership.findAll({
    where: { userId: req.user.id },
    include: [{ model: Project }],
  });
  res.json(memberships.map((m) => ({ ...m.project.toJSON(), role: m.role })));
});

const addMemberSchema = z.object({
  userId: z.number().int(),
  role: z.enum(["admin", "manager", "developer", "submitter"]),
});

// Add someone to a project, or change their existing role. Admin/manager
// only — this is the route the frontend's "Role Assignment" screen will
// eventually call.
router.post("/:projectId/members", requireRole(["admin", "manager"]), async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { userId, role } = parsed.data;
  const { projectId } = req.params;

  const targetUser = await User.findByPk(userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const [membership] = await ProjectMembership.upsert({ userId, projectId, role });
  res.status(200).json(membership);
});

export default router;