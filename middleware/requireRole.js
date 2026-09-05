import ProjectMembership from "../models/ProjectMembership.js";

// AUTHORIZATION only: "what can this user do?"
// Must run after verifyToken (needs req.user.id already set). Looks up
// the ProjectMembership row for (req.user.id, projectId) — never a global
// role on User — and checks it against the roles this route allows.
//
// projectId is read from the URL (req.params.projectId) when the route
// already names a project (e.g. POST /projects/:projectId/members), or
// from the body (req.body.projectId) for create-style routes. Routes that
// act on an EXISTING resource (like a ticket) must set req.body.projectId
// from that resource's own record before this runs — never trust a
// client-supplied projectId for something that already has one on record.
export default function requireRole(allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const membership = await ProjectMembership.findOne({
      where: { userId: req.user.id, projectId },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      return res.status(403).json({ error: "You do not have permission to do this on this project" });
    }

    req.membership = membership;
    next();
  };
}