import { listStores } from "@/actions/stores";
import { StoresClient } from "@/components/stores/stores-client";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await listStores();
  return <StoresClient stores={stores} />;
}
