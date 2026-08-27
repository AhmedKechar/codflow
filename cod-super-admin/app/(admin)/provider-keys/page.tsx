import { listProviderKeys } from "@/actions/provider-keys";
import { ProviderKeysClient } from "@/components/provider-keys/provider-keys-client";

export const dynamic = "force-dynamic";

export default async function ProviderKeysPage() {
  const keys = await listProviderKeys();
  return <ProviderKeysClient keys={keys} />;
}
