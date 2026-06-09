"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import GameSidebar from "@/components/game/shared/GameSidebar";
import AIMentor from "@/components/game/mentor/AIMentor";
import GameNotification from "@/components/game/shared/GameNotification";
import GameTimeBar from "@/components/game/shared/GameTimeBar";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    player,
    setPlayer,
    setEconomy,
    setBusinesses,
    setInvestments,
    setProperties,
    setLoans,
    setBankAccounts,
    setMarkets,
    setActiveEvents,
    setGovernment,
    notification,
    clearNotification,
    isTimePaused,
    gameSpeed,
  } = useGameStore();

  const loadGameData = useCallback(async (playerId: string) => {
    try {
      const [economyRes, businessRes, investRes, bankRes, marketsRes, eventsRes] = await Promise.all([
        fetch("/api/economy"),
        fetch(`/api/business?playerId=${playerId}`),
        fetch(`/api/investments?playerId=${playerId}`),
        fetch(`/api/banking?playerId=${playerId}`),
        fetch("/api/markets"),
        fetch("/api/events?active=true"),
      ]);

      const [eco, biz, inv, bank, mkt, evt] = await Promise.all([
        economyRes.json(),
        businessRes.json(),
        investRes.json(),
        bankRes.json(),
        marketsRes.json(),
        eventsRes.json(),
      ]);

      if (eco.economy) setEconomy(eco.economy);
      if (eco.government) setGovernment(eco.government);
      if (biz.businesses) setBusinesses(biz.businesses);
      if (inv.investments) setInvestments(inv.investments);
      if (inv.markets) setMarkets(inv.markets);
      if (bank.accounts) setBankAccounts(bank.accounts);
      if (bank.loans) setLoans(bank.loans);
      if (mkt.markets) setMarkets(mkt.markets);
      if (evt.events) setActiveEvents(evt.events);
    } catch (err) {
      console.error("Failed to load game data:", err);
    }
  }, [setEconomy, setGovernment, setBusinesses, setInvestments, setMarkets, setBankAccounts, setLoans, setActiveEvents]);

  useEffect(() => {
    // Load player from API if not in store
    const init = async () => {
      if (!player) {
        const res = await fetch("/api/player");
        const data = await res.json();
        if (!data.player) {
          router.push("/");
          return;
        }
        setPlayer(data.player);
        await loadGameData(data.player.id);
      } else {
        await loadGameData(player.id);
      }
    };
    init();
  }, []);

  // Auto-advance time
  useEffect(() => {
    if (!player || isTimePaused) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/economy/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: player.id, days: gameSpeed }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.player) setPlayer(data.player);
          if (data.economy) setEconomy(data.economy);
          if (data.markets) setMarkets(data.markets);
        }
      } catch {}
    }, 10000 / gameSpeed); // Every 10s at speed 1, faster at higher speeds

    return () => clearInterval(interval);
  }, [player, isTimePaused, gameSpeed]);

  return (
    <div className="flex h-screen bg-[#060B14] overflow-hidden">
      <GameSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <GameTimeBar />
        {/* pb-16 on mobile reserves space above bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <AIMentor />

      {notification && (
        <GameNotification
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </div>
  );
}
