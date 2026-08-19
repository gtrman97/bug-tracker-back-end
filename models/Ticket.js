import { DataTypes } from "sequelize";
import sequelize from "./index.js";
import User from "./User.js";

const Ticket = sequelize.define("ticket", {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM("open", "in_progress", "closed"),
    defaultValue: "open",
  },
});

// A ticket belongs to (is assigned to) one user
Ticket.belongsTo(User, { as: "assignee" });
// A user can have many tickets
User.hasMany(Ticket, { foreignKey: "assigneeId" });

export default Ticket;