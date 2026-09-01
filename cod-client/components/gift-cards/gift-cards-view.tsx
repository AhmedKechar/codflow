"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGiftCards, useNavigation } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { GiftCardList } from "@/components/gift-cards/gift-card-list";
import { getGiftCards, type GiftCard } from "@/actions/gift-cards";
import { PageHeader } from "@/components/ui/page-header";

export function GiftCardsView() {
  const t = useGiftCards();
  const nav = useNavigation();
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.gift_cards}
        primaryAction={{
          label: t.actions?.create ?? "Create Gift Card",
          onClick: () => router.push("/store/gift-cards/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
        secondaryActions={[
          {
            label: "Refresh",
            onClick: fetchData,
            icon: <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />,
          },
        ]}
      />

      <GiftCardList cards={cards} isLoading={isLoading} onRefresh={fetchData} />
    </div>
  );
}
