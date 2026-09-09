import { DataTypes } from "sequelize";
import sequelize from "./index.js";

// Associations (assignee, project) are wired centrally in associations.js.
const Ticket = sequelize.define("ticket", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM("open", "in_progress", "closed"),
    defaultValue: "open",
    allowNull: false,
  },
  // Triage signal, independent of status. Deliberately no "type" (bug vs.
  // feature) field — that's taxonomy this tracker doesn't need; priority
  // is the thing people actually use to decide what to work on next.
  priority: {
    type: DataTypes.ENUM("none", "low", "medium", "high"),
    defaultValue: "none",
    allowNull: false,
  },
});

export default Ticket;