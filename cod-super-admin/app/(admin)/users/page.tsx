import { listUsers } from "@/actions/users";
import { UsersClient } from "@/components/users/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await listUsers();
  return <UsersClient users={users} />;
}
