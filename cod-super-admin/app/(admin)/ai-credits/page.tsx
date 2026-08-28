import { listAllAiCredits } from "@/actions/ai-credits";
import { AiCreditsClient } from "@/components/ai-credits/ai-credits-client";

export default async function AiCreditsPage() {
  const credits = await listAllAiCredits();

  return <AiCreditsClient credits={credits} />;
}
