import { DataTypes } from "sequelize";
import sequelize from "./index.js";

// This table is the source of truth for "what can this user do" — it is
// deliberately NOT a role field on User. Someone can be an admin on one
// project and a submitter on another; authorization checks should always
// be scoped to (userId, projectId), never to a global role.
const ProjectMembership = sequelize.define(
  "project_membership",
  {
    role: {
      type: DataTypes.ENUM("admin", "manager", "developer", "submitter"),
      allowNull: false,
      defaultValue: "submitter",
    },
  },
  {
    indexes: [
      // A user has exactly one role per project. Enforced at the DB level,
      // not just in application code, so a race condition or a future
      // route that skips a check can't create duplicate memberships.
      {
        unique: true,
        fields: ["userId", "projectId"],
      },
    ],
  }
);

export default ProjectMembership;