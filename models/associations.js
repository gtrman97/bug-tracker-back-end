import User from "./User.js";
import Project from "./Project.js";
import ProjectMembership from "./ProjectMembership.js";
import Ticket from "./Ticket.js";

// --- Project ownership -----------------------------------------------
// The creator of a project. Ownership is separate from ProjectMembership
// roles — an owner is always effectively an admin, but this keeps "who
// created it" distinct from "who currently has admin rights" (ownership
// could transfer later without touching membership rows).
Project.belongsTo(User, { as: "owner", foreignKey: "ownerId" });
User.hasMany(Project, { as: "ownedProjects", foreignKey: "ownerId" });

// --- Project membership (roles live here, not on User) ----------------
User.belongsToMany(Project, {
  through: ProjectMembership,
  as: "projects",
  foreignKey: "userId",
});
Project.belongsToMany(User, {
  through: ProjectMembership,
  as: "members",
  foreignKey: "projectId",
});
// Direct associations to the join model itself, so a membership row (with
// its role) can be fetched/queried without going through the M:N alias —
// this is what requireRole() will use.
User.hasMany(ProjectMembership, { foreignKey: "userId" });
Project.hasMany(ProjectMembership, { foreignKey: "projectId" });
ProjectMembership.belongsTo(User, { foreignKey: "userId" });
ProjectMembership.belongsTo(Project, { foreignKey: "projectId" });

// --- Tickets ------------------------------------------------------------
Ticket.belongsTo(User, { as: "assignee", foreignKey: "assigneeId" });
User.hasMany(Ticket, { as: "assignedTickets", foreignKey: "assigneeId" });

Ticket.belongsTo(Project, { foreignKey: { name: "projectId", allowNull: false } });
Project.hasMany(Ticket, { foreignKey: { name: "projectId", allowNull: false } });

export { User, Project, ProjectMembership, Ticket };