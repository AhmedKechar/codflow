/**
 * Store Members Routes
 *
 * Team member management for the merchant's store: listing, updating roles,
 * removing members, and handling invitations.
 *
 * Migrated to defineRoute() from @/lib/route-builder.
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import * as h from "./handlers";

const listMembersRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.STORE_MEMBERS_READ },
  tags: ["Store Members"],
  summary: "List team members",
  operationId: "listMembers",
  handler: h.listMembers,
});

const getMemberRoute = defineRoute({
  method: "get",
  path: "/{id}",
  auth: { scope: SCOPES.STORE_MEMBERS_READ },
  tags: ["Store Members"],
  summary: "Get member details",
  operationId: "getMember",
  params: z.object({ id: z.string() }),
  handler: h.getMember,
});

const updateRoleRoute = defineRoute({
  method: "patch",
  path: "/{id}/role",
  auth: { scope: SCOPES.STORE_MEMBERS_MANAGE },
  tags: ["Store Members"],
  summary: "Update member role",
  operationId: "updateRole",
  params: z.object({ id: z.string() }),
  body: z.object({ role: z.enum(["owner", "admin", "staff"]) }),
  handler: h.updateRole,
});

const removeMemberRoute = defineRoute({
  method: "delete",
  path: "/{id}",
  auth: { scope: SCOPES.STORE_MEMBERS_MANAGE },
  tags: ["Store Members"],
  summary: "Remove team member",
  operationId: "removeMember",
  params: z.object({ id: z.string() }),
  handler: h.removeMember,
});

const listInvitationsRoute = defineRoute({
  method: "get",
  path: "/invitations",
  auth: { scope: SCOPES.STORE_MEMBERS_READ },
  tags: ["Store Members"],
  summary: "List pending invitations",
  operationId: "listInvitations",
  handler: h.listInvitations,
});

const sendInvitationRoute = defineRoute({
  method: "post",
  path: "/invitations",
  auth: { scope: SCOPES.STORE_MEMBERS_INVITE },
  tags: ["Store Members"],
  summary: "Send team invitation",
  operationId: "sendInvitation",
  body: z.object({
    email: z.string().email(),
    role: z.enum(["owner", "admin", "staff"]).optional(),
  }),
  responses: {
    201: { description: "Invitation sent" },
  },
  handler: h.sendInvitation,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(listMembersRoute.route, listMembersRoute.handler);
router.openapi(getMemberRoute.route, getMemberRoute.handler);
router.openapi(updateRoleRoute.route, updateRoleRoute.handler);
router.openapi(removeMemberRoute.route, removeMemberRoute.handler);
router.openapi(listInvitationsRoute.route, listInvitationsRoute.handler);
router.openapi(sendInvitationRoute.route, sendInvitationRoute.handler);

export default router;
