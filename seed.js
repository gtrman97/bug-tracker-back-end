import sequelize from "./models/index.js";
import "./models/associations.js";
import User from "./models/User.js";
import Project from "./models/Project.js";
import ProjectMembership from "./models/ProjectMembership.js";
import Ticket from "./models/Ticket.js";

const seed = async () => {
  await sequelize.sync({ force: true }); // drops and recreates tables — seed data only

  const alice = await User.create({
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "password123",
  });

  const bob = await User.create({
    name: "Bob Smith",
    email: "bob@example.com",
    password: "password123",
  });

  const project = await Project.create({
    name: "Bug Tracker",
    description: "The tracker app itself, tracking its own bugs.",
    ownerId: alice.id,
  });

  await ProjectMembership.create({ userId: alice.id, projectId: project.id, role: "admin" });
  await ProjectMembership.create({ userId: bob.id, projectId: project.id, role: "developer" });

  await Ticket.create({
    title: "Login button unresponsive on Safari",
    description: "Clicking login does nothing in Safari 17, works fine in Chrome.",
    status: "open",
    assigneeId: alice.id,
    projectId: project.id,
  });

  await Ticket.create({
    title: "Dashboard chart mislabels Q2 revenue",
    description: "Recharts is pulling the wrong data key for Q2.",
    status: "in_progress",
    assigneeId: bob.id,
    projectId: project.id,
  });

  await Ticket.create({
    title: "Password reset email never arrives",
    description: "Reported by three users so far. Possibly a mail provider issue.",
    status: "closed",
    assigneeId: alice.id,
    projectId: project.id,
  });

  console.log("Seed complete.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});