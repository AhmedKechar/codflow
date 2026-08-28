"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGiftCards } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { GiftCardList } from "@/components/gift-cards/gift-card-list";
import { getGiftCards, type GiftCard } from "@/actions/gift-cards";

export function GiftCardsView() {
  const t = useGiftCards();
  const router = useRouter();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getGiftCards();
      setCards(result.rows);
    } catch (error) {
      console.error("Failed to fetch gift cards:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.page_title ?? "Gift Cards"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.page_subtitle ?? "Manage your gift cards"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/store/gift-cards/new")}
          >
            <Plus size={16} className="mr-2" />
            {t.actions?.create ?? "Create Gift Card"}
          </Button>
        </div>
      </div>

      <GiftCardList cards={cards} isLoading={isLoading} onRefresh={fetchData} />
    </div>
  );
}
