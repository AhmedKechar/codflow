import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { requireScope } from "@/rbac/middleware";
import * as h from "./handlers";
import { ErrorResponseSchema } from "@/openapi/schemas";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});
const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ErrorResponseSchema),
});

const listMembersRoute = createRoute({
  method: "get",
  path: "/",
  middleware: [requireScope(SCOPES.STORE_MEMBERS_READ)],
  tags: ["Store Members"],
  summary: "List team members",
  operationId: "listMembers",
  responses: {
    200: { description: "Member list" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const getMemberRoute = createRoute({
  method: "get",
  path: "/{id}",
  middleware: [requireScope(SCOPES.STORE_MEMBERS_READ)],
  tags: ["Store Members"],
  summary: "Get member details",
  operationId: "getMember",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Member details" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Member not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const updateRoleRoute = createRoute({
  method: "patch",
  path: "/{id}/role",
  middleware: [requireScope(SCOPES.STORE_MEMBERS_MANAGE)],
  tags: ["Store Members"],
  summary: "Update member role",
  operationId: "updateRole",
  request: {
    params: z.object({ id: z.string() }),
    body: { required: true, content: jsonContent(z.object({ role: z.enum(["owner", "admin", "staff"]) })) },
  },
  responses: {
    200: { description: "Role updated" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Member not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const removeMemberRoute = createRoute({
  method: "delete",
  path: "/{id}",
  middleware: [requireScope(SCOPES.STORE_MEMBERS_MANAGE)],
  tags: ["Store Members"],
  summary: "Remove team member",
  operationId: "removeMember",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Member removed" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Member not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const listInvitationsRoute = createRoute({
  method: "get",
  path: "/invitations",
  middleware: [requireScope(SCOPES.STORE_MEMBERS_READ)],
  tags: ["Store Members"],
  summary: "List pending invitations",
  operationId: "listInvitations",
  responses: {
    200: { description: "Invitation list" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const sendInvitationRoute = createRoute({
  method: "post",
  path: "/invitations",
  middleware: [requireScope(SCOPES.STORE_MEMBERS_INVITE)],
  tags: ["Store Members"],
  summary: "Send team invitation",
  operationId: "sendInvitation",
  request: {
    body: {
      required: true,
      content: jsonContent(z.object({
        email: z.string().email(),
        role: z.enum(["owner", "admin", "staff"]).optional(),
      })),
    },
  },
  responses: {
    201: { description: "Invitation sent" },
    400: errorResponse("Validation error"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const router = new OpenAPIHono<AppContext>();
router.openapi(listMembersRoute, h.listMembers);
router.openapi(getMemberRoute, h.getMember);
router.openapi(updateRoleRoute, h.updateRole);
router.openapi(removeMemberRoute, h.removeMember);
router.openapi(listInvitationsRoute, h.listInvitations);
router.openapi(sendInvitationRoute, h.sendInvitation);
export default router;
