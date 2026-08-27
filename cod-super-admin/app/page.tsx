import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "super_admin") redirect("/sign-in");
  redirect("/dashboard");
}
