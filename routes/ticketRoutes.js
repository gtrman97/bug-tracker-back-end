import { Router } from "express";
import { z } from "zod";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import verifyToken from "../middleware/verifyToken.js";
import requireRole from "../middleware/requireRole.js";

const router = Router();
router.use(verifyToken);

// Any project member can create/view/update tickets for now — the
// middleware already supports narrower role lists per-route (e.g. delete
// below), so tightening create/update to specific roles later is a
// one-line change, not a redesign.
const ANY_MEMBER = ["admin", "manager", "developer", "submitter"];

const createTicketSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: z.enum(["open", "in_progress", "closed"]).optional(),
  assigneeId: z.number().int().optional(),
  projectId: z.number().int(),
});

router.post("/", requireRole(ANY_MEMBER), async (req, res) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const ticket = await Ticket.create(parsed.data);
  const full = await Ticket.findByPk(ticket.id, {
    include: [{ model: User, as: "assignee" }, { model: Project }],
  });
  res.status(201).json(full);
});

router.get("/project/:projectId", requireRole(ANY_MEMBER), async (req, res) => {
  const tickets = await Ticket.findAll({
    where: { projectId: req.params.projectId },
    include: [{ model: User, as: "assignee" }],
  });
  res.json(tickets);
});

// Loads the ticket and pins req.body.projectId to the ticket's ACTUAL
// project before requireRole runs — this is what stops someone lying
// about a ticket's projectId in the request body to dodge the check.
async function attachTicketProject(req, res, next) {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  req.ticket = ticket;
  req.body.projectId = ticket.projectId;
  next();
}

const updateTicketSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  status: z.enum(["open", "in_progress", "closed"]).optional(),
  assigneeId: z.number().int().nullable().optional(),
});

router.patch("/:id", attachTicketProject, requireRole(ANY_MEMBER), async (req, res) => {
  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  await req.ticket.update(parsed.data);
  const updated = await Ticket.findByPk(req.ticket.id, { include: [{ model: User, as: "assignee" }] });
  res.json(updated);
});

// Deleting is more destructive than editing, so it's restricted to
// admin/manager even though anyone can create or update a ticket.
router.delete("/:id", attachTicketProject, requireRole(["admin", "manager"]), async (req, res) => {
  await req.ticket.destroy();
  res.status(204).send();
});

export default router;