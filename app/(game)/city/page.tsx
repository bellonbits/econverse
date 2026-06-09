"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/store/game-store";
import { Building2 } from "lucide-react";

const CityScene = dynamic(() => import("@/components/game/city/CityScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#060B14]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
          <Building2 size={24} className="text-blue-400" />
        </div>
        <p className="text-slate-400 text-sm">Rendering your city...</p>
      </div>
    </div>
  ),
});

export default function CityPage() {
  const { player, economy, businesses, activeEvents } = useGameStore();

  return (
    <div className="flex flex-col h-full">
      {/* City stats bar */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-bold text-white"><Building2 size={15} className="text-blue-400" /> Metro City</div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Businesses:</span>
            <span className="font-bold text-white">{businesses.length}</span>
          </div>
          {economy && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Consumer Confidence:</span>
                <span className={`font-bold ${economy.consumerConfidence > 60 ? "text-emerald-400" : "text-yellow-400"}`}>
                  {economy.consumerConfidence.toFixed(0)}/100
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Stock Index:</span>
                <span className="font-bold text-blue-400">{economy.stockMarketIndex.toFixed(0)}</span>
              </div>
            </>
          )}
          {activeEvents.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="font-bold text-orange-400">{activeEvents.length} active event{activeEvents.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        <CityScene />
      </div>
    </div>
  );
}
