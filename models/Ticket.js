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
});

export default Ticket;