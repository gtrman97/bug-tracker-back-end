import { DataTypes } from "sequelize";
import sequelize from "./index.js";

// Associations (ownerId, memberships, tickets) are wired centrally in
// associations.js, not here — see that file for why.
const Project = sequelize.define("project", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Project-level lifecycle state. Deliberately separate from Ticket.status
  // (which tracks individual tickets) — a project can be "in_progress"
  // while containing a mix of open and closed tickets.
  status: {
    type: DataTypes.ENUM("not_started", "in_progress", "completed"),
    defaultValue: "not_started",
    allowNull: false,
  },
});

export default Project;