"use client";

import { Pause, Play, Heart, Smile, DollarSign } from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { gameDayToDate, formatCurrency } from "@/lib/utils";

export default function GameTimeBar() {
  const { player, isTimePaused, setTimePaused, gameSpeed, setGameSpeed, economy } = useGameStore();
  if (!player) return null;

  const SPEEDS = [1, 2, 5, 10] as const;

  return (
    <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 py-2 md:py-2.5 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-sm flex-shrink-0 min-w-0">

      {/* Date — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-medium text-white">{gameDayToDate(player.gameDay)}</span>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full hidden md:inline">Day {player.gameDay}</span>
      </div>
      {/* Day only on small */}
      <span className="sm:hidden text-xs text-slate-400 font-mono flex-shrink-0">D{player.gameDay}</span>

      <div className="hidden sm:block w-px h-4 bg-slate-700 flex-shrink-0" />

      {/* Time controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setTimePaused(!isTimePaused)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
            isTimePaused
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {isTimePaused ? <Pause size={10} /> : <Play size={10} />}
          <span className="hidden sm:inline">{isTimePaused ? "Paused" : "Running"}</span>
        </button>

        <div className="flex items-center gap-0.5">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => setGameSpeed(speed)}
              className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                gameSpeed === speed && !isTimePaused
                  ? "bg-blue-500/30 text-blue-400 border border-blue-500/40"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="hidden sm:block w-px h-4 bg-slate-700 flex-shrink-0" />

      {/* Quick stats */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <DollarSign size={11} className="text-slate-500 flex-shrink-0 hidden sm:block" />
          <span className="text-xs text-slate-500 font-medium hidden md:inline">Cash</span>
          <span className="text-sm font-mono font-bold text-emerald-400 truncate">{formatCurrency(player.money, true)}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-xs text-slate-500 font-medium hidden md:inline">Net Worth</span>
          <span className="text-sm font-mono font-bold text-white">{formatCurrency(player.netWorth, true)}</span>
        </div>
        {economy && (
          <div className="hidden lg:flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">Index</span>
            <span className="text-xs font-mono font-bold text-blue-400">{economy.stockMarketIndex.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Vitals */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Smile size={12} className="text-yellow-400" />
          <div className="w-10 md:w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${player.happiness}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Heart size={12} className="text-red-400" />
          <div className="w-10 md:w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-400 rounded-full" style={{ width: `${player.health}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
