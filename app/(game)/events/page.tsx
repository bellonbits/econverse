"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { getMentorExplanation } from "@/lib/event-engine";
import { gameDayToDate } from "@/lib/utils";
import {
  TrendingDown, TrendingUp, Flame, AlertTriangle, Sun, Rocket,
  Building2, FileText, Swords, Wind, CheckCircle2, Zap, Bot, X, type LucideIcon,
} from "lucide-react";

const SEVERITY_CONFIG = {
  1: { label: "Minor",        color: "text-blue-400 border-blue-500/30 bg-blue-500/10",     dot: "bg-blue-400"   },
  2: { label: "Moderate",     color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",     dot: "bg-cyan-400"   },
  3: { label: "Significant",  color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", dot: "bg-yellow-400" },
  4: { label: "Major",        color: "text-orange-400 border-orange-500/30 bg-orange-500/10", dot: "bg-orange-400" },
  5: { label: "Critical",     color: "text-red-400 border-red-500/30 bg-red-500/10",        dot: "bg-red-400"    },
  6: { label: "Catastrophic", color: "text-red-600 border-red-700/30 bg-red-700/10",        dot: "bg-red-600"    },
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  recession: TrendingDown, boom: TrendingUp, crash: Flame, pandemic: AlertTriangle,
  drought: Sun, tech_boom: Rocket, housing_boom: Building2, policy_change: FileText,
  trade_war: Swords, natural_disaster: Wind,
};

export default function EventsPage() {
  const { activeEvents, player, economy } = useGameStore();
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    if (!player) return;
    fetch("/api/events").then((r) => r.json()).then((d) => setAllEvents(d.events ?? []));
  }, [player?.gameDay]);

  const combined = [...activeEvents, ...allEvents].filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);

  const renderEventIcon = (type: string, size = 20) => {
    const Icon = TYPE_ICONS[type] ?? Zap;
    return <Icon size={size} />;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Zap size={22} className="text-yellow-400" /> Economic Events</h1>
        <p className="text-sm text-slate-400 mt-0.5">Real-world disruptions shaping your economy</p>
      </div>

      {economy && (
        <div className="glass-card rounded-2xl p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "GDP Growth",   value: `${economy.gdpGrowth > 0 ? "+" : ""}${economy.gdpGrowth.toFixed(1)}%`, ok: economy.gdpGrowth > 0 },
              { label: "Inflation",    value: `${economy.inflation.toFixed(1)}%`,           ok: economy.inflation < 3 },
              { label: "Unemployment", value: `${economy.unemployment.toFixed(1)}%`,        ok: economy.unemployment < 6 },
              { label: "Interest Rate",value: `${economy.interestRate.toFixed(2)}%`,        ok: economy.interestRate < 5 },
              { label: "Confidence",   value: `${economy.consumerConfidence.toFixed(0)}`,  ok: economy.consumerConfidence > 60 },
              { label: "Stock Index",  value: economy.stockMarketIndex.toFixed(0),          ok: true },
            ].map((i) => (
              <div key={i.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">{i.label}</div>
                <div className={`text-sm font-bold ${i.ok ? "text-emerald-400" : "text-red-400"}`}>{i.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Active Events ({activeEvents.length})
        </h2>
        {activeEvents.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No active disruptions. Economy is stable.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeEvents.map((event) => {
              const severity = Math.round(Math.max(1, Math.min(6, event.severity)));
              const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG[3];
              const Icon = TYPE_ICONS[event.type] ?? Zap;
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-5 border cursor-pointer hover:scale-[1.01] transition-all ${config.color}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center flex-shrink-0"><Icon size={20} /></div>
                      <div>
                        <div className="font-bold text-white">{event.title}</div>
                        <div className={`text-xs font-medium ${config.color.split(" ")[0]}`}>{config.label} Impact · Day {event.gameDay}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                      <span className="text-xs text-slate-400">Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">{event.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(event.impacts) ? event.impacts : []).slice(0, 3).map((impact: any, i: number) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-xs font-medium ${impact.change > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                        {impact.metric}: {impact.change > 0 ? "+" : ""}{impact.change.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {combined.filter((e) => !e.isActive).length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><FileText size={13} /> Recent Events</h2>
          <div className="space-y-2">
            {combined.filter((e) => !e.isActive).slice(0, 10).map((event) => {
              const severity = Math.round(Math.max(1, Math.min(6, event.severity)));
              const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG[3];
              const Icon = TYPE_ICONS[event.type] ?? Zap;
              return (
                <div key={event.id} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer opacity-70 hover:opacity-100" onClick={() => setSelectedEvent(event)}>
                  <Icon size={18} className="text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-300 truncate">{event.title}</div>
                    <div className="text-xs text-slate-500">Day {event.gameDay}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>
                  <span className="text-slate-600 text-xs">Past</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedEvent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
        >
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card rounded-3xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                  {renderEventIcon(selectedEvent.type, 22)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedEvent.title}</h2>
                  <div className="text-xs text-slate-400">Day {selectedEvent.gameDay}</div>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <p className="text-sm text-slate-300 mb-4">{selectedEvent.description}</p>

            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Economic Impacts</div>
              {(Array.isArray(selectedEvent.impacts) ? selectedEvent.impacts : []).map((impact: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl ${impact.change > 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <div>
                    <span className="text-sm font-semibold text-white capitalize">{impact.metric.replace("_", " ")}</span>
                    <div className="text-xs text-slate-400">{impact.description}</div>
                  </div>
                  <span className={`font-bold text-sm ${impact.change > 0 ? "text-emerald-400" : "text-red-400"}`}>{impact.change > 0 ? "+" : ""}{impact.change.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="bg-purple-900/30 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Bot size={14} className="text-purple-400" /><span className="text-xs font-bold text-purple-400">Economics Explanation</span></div>
              <p className="text-xs text-slate-300 leading-relaxed">{getMentorExplanation(selectedEvent.type)}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
