"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useGiftCards } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { GiftCardForm } from "@/components/gift-cards/gift-card-form";

export default function NewGiftCardPage() {
  const t = useGiftCards();
  const router = useRouter();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/store/gift-cards")}
        >
          <ArrowRight size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.form?.title_create ?? "Create Gift Card"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.form?.subtitle_create ?? "Create a new gift card for your customers"}
          </p>
        </div>
      </div>

      <GiftCardForm mode="create" />
    </div>
  );
}
