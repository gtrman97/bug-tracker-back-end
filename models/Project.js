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
});

export default Project;