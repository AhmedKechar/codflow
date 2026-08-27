/**
 * Store Members & Invitations Queries — Unit Tests
 *
 * Coverage:
 *  1. getStoreMembers / getStoreMemberById — member retrieval
 *  2. isStoreMember / addStoreMember / updateMemberRole / removeStoreMember
 *  3. getStoreInvitations / createInvitation / acceptInvitation
 *  4. countStoreMembers
 */

import { describe, it, expect } from "vitest";
import {
  getStoreMembers,
  getStoreMemberById,
  isStoreMember,
  addStoreMember,
  updateMemberRole,
  removeStoreMember,
  getStoreInvitations,
  createInvitation,
  acceptInvitation,
  countStoreMembers,
} from "../../../../cod-shared/queries/store-members";
import { makeMockDb, a } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function memberRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "mem_1",
    user_id: "user_1",
    store_id: "test-store",
    role: "staff",
    status: "active",
    invited_by: null,
    invited_at: null,
    joined_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_1",
    name: "Ahmed Benali",
    email: "ahmed@example.com",
    email_verified: 1,
    image: null,
    role: "staff",
    status: "active",
    api_key: null,
    created_at: 1735689600000,
    updated_at: 1735689600000,
    ...overrides,
  };
}

function memberUserJoinRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "mem_1",
    _uid: "user_1",
    store_id: "test-store",
    role: "staff",
    status: "active",
    invited_by: null,
    invited_at: null,
    joined_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    _uid2: "user_1",
    _uname: "Ahmed Benali",
    _uemail: "ahmed@example.com",
    ...overrides,
  };
}

function invitationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv_1",
    store_id: "test-store",
    email: "new@example.com",
    role: "staff",
    invited_by: "user_1",
    token: "tok_abc123",
    expires_at: "2026-02-01T00:00:00.000Z",
    accepted_at: null,
    created_at: NOW,
    ...overrides,
  };
}

// ─── getStoreMembers ─────────────────────────────────────────────────────────

describe("getStoreMembers", () => {
  it("returns members with user data", async () => {
    const db = makeMockDb([a([memberUserJoinRow()])]);
    const result = await getStoreMembers(db, "test-store");
    expect(result).toHaveLength(1);
    expect(result[0].member.id).toBe("mem_1");
    expect(result[0].user.name).toBe("Ahmed Benali");
  });

  it("returns empty array when no members exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getStoreMembers(db, "no-store");
    expect(result).toHaveLength(0);
  });
});

// ─── getStoreMemberById ──────────────────────────────────────────────────────

describe("getStoreMemberById", () => {
  it("returns member with user data when found", async () => {
    const db = makeMockDb([a([memberUserJoinRow()])]);
    const result = await getStoreMemberById(db, "mem_1");
    expect(result).toBeDefined();
    expect(result?.member.id).toBe("mem_1");
    expect(result?.user.email).toBe("ahmed@example.com");
  });

  it("returns falsy when member doesn't exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getStoreMemberById(db, "nonexistent");
    expect(result).toBeFalsy();
  });
});

// ─── isStoreMember ───────────────────────────────────────────────────────────

describe("isStoreMember", () => {
  it("returns member when user is active in store", async () => {
    const db = makeMockDb([a([memberRow()])]);
    const result = await isStoreMember(db, "test-store", "user_1");
    expect(result).toBeDefined();
    expect(result?.userId).toBe("user_1");
  });

  it("returns undefined when user is not a member", async () => {
    const db = makeMockDb([a([])]);
    const result = await isStoreMember(db, "test-store", "unknown-user");
    expect(result).toBeUndefined();
  });
});

// ─── addStoreMember ──────────────────────────────────────────────────────────

describe("addStoreMember", () => {
  it("adds a member with default staff role", async () => {
    const db = makeMockDb([a([memberRow()])]);
    const result = await addStoreMember(db, {
      id: "mem_1",
      userId: "user_1",
      storeId: "test-store",
    });
    expect(result).toBeDefined();
    expect(result.role).toBe("staff");
    expect(result.status).toBe("active");
  });

  it("adds a member with specified role and invitedBy", async () => {
    const db = makeMockDb([a([memberRow({ role: "admin", invited_by: "owner_1" })])]);
    const result = await addStoreMember(db, {
      id: "mem_2",
      userId: "user_2",
      storeId: "test-store",
      role: "admin",
      invitedBy: "owner_1",
    });
    expect(result).toBeDefined();
    expect(result.role).toBe("admin");
    expect(result.invitedBy).toBe("owner_1");
  });
});

// ─── updateMemberRole ────────────────────────────────────────────────────────

describe("updateMemberRole", () => {
  it("updates member role to admin", async () => {
    const db = makeMockDb([a([memberRow({ role: "admin" })])]);
    const result = await updateMemberRole(db, "mem_1", "admin");
    expect(result).toBeDefined();
    expect(result.role).toBe("admin");
  });

  it("updates member role to owner", async () => {
    const db = makeMockDb([a([memberRow({ role: "owner" })])]);
    const result = await updateMemberRole(db, "mem_1", "owner");
    expect(result.role).toBe("owner");
  });
});

// ─── removeStoreMember ───────────────────────────────────────────────────────

describe("removeStoreMember", () => {
  it("removes a member successfully", async () => {
    const db = makeMockDb([a([memberRow()])]);
    await expect(removeStoreMember(db, "mem_1")).resolves.not.toThrow();
  });
});

// ─── getStoreInvitations ─────────────────────────────────────────────────────

describe("getStoreInvitations", () => {
  it("returns invitations for a store", async () => {
    const db = makeMockDb([a([invitationRow(), invitationRow({ id: "inv_2", email: "other@example.com" })])]);
    const result = await getStoreInvitations(db, "test-store");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("inv_1");
  });

  it("returns empty array when no invitations", async () => {
    const db = makeMockDb([a([])]);
    const result = await getStoreInvitations(db, "no-store");
    expect(result).toHaveLength(0);
  });
});

// ─── createInvitation ────────────────────────────────────────────────────────

describe("createInvitation", () => {
  it("creates an invitation with defaults", async () => {
    const db = makeMockDb([a([invitationRow()])]);
    const result = await createInvitation(db, {
      id: "inv_1",
      storeId: "test-store",
      email: "new@example.com",
      invitedBy: "user_1",
      token: "tok_abc123",
      expiresAt: "2026-02-01T00:00:00.000Z",
    });
    expect(result).toBeDefined();
    expect(result.email).toBe("new@example.com");
    expect(result.role).toBe("staff");
  });

  it("creates invitation with admin role", async () => {
    const db = makeMockDb([a([invitationRow({ role: "admin" })])]);
    const result = await createInvitation(db, {
      id: "inv_2",
      storeId: "test-store",
      email: "admin@example.com",
      role: "admin",
      invitedBy: "user_1",
      token: "tok_def456",
      expiresAt: "2026-02-01T00:00:00.000Z",
    });
    expect(result.role).toBe("admin");
  });
});

// ─── acceptInvitation ────────────────────────────────────────────────────────

describe("acceptInvitation", () => {
  it("marks invitation as accepted", async () => {
    const db = makeMockDb([a([invitationRow({ accepted_at: NOW })])]);
    const result = await acceptInvitation(db, "inv_1");
    expect(result).toBeDefined();
    expect(result.acceptedAt).toBe(NOW);
  });
});

// ─── countStoreMembers ───────────────────────────────────────────────────────

describe("countStoreMembers", () => {
  it("returns count of active members", async () => {
    const db = makeMockDb([{ _: "f", v: { count: 5 } }]);
    const result = await countStoreMembers(db, "test-store");
    expect(result).toBe(5);
  });

  it("returns 0 when no active members", async () => {
    const db = makeMockDb([{ _: "f", v: { count: 0 } }]);
    const result = await countStoreMembers(db, "no-store");
    expect(result).toBe(0);
  });
});
