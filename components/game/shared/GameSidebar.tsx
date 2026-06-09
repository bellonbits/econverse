"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, Home, Briefcase, Store,
  Landmark, TrendingUp, Building, Zap, ChevronRight,
  ChevronLeft, MoreHorizontal, X,
} from "lucide-react";
import { useGameStore } from "@/store/game-store";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard",   Icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/city",        Icon: Building2,       label: "City View"   },
  { href: "/life",        Icon: Home,            label: "Daily Life"  },
  { href: "/career",      Icon: Briefcase,       label: "Career"      },
  { href: "/business",    Icon: Store,           label: "Business"    },
  { href: "/banking",     Icon: Landmark,        label: "Banking"     },
  { href: "/investments", Icon: TrendingUp,      label: "Investments" },
  { href: "/real-estate", Icon: Building,        label: "Real Estate" },
  { href: "/events",      Icon: Zap,             label: "Events"      },
];

// First 4 shown in bottom bar; rest behind "More"
const BOTTOM_PRIMARY = NAV_ITEMS.slice(0, 4);
const BOTTOM_MORE    = NAV_ITEMS.slice(4);

// ─── Desktop sidebar ────────────────────────────────────────────────────────
export default function GameSidebar() {
  const pathname = usePathname();
  const { player, sidebarCollapsed, setSidebarCollapsed, economy, activeEvents } = useGameStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 64 : 232 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-shrink-0 flex-col h-full bg-slate-900/95 border-r border-slate-800/60 backdrop-blur-xl z-20"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-black text-sm flex-shrink-0 text-white">E</div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="ml-2.5 font-bold text-white text-sm tracking-tight">
                EconoVerse
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex-1" />
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Player card */}
        {player && !sidebarCollapsed && (
          <div className="px-3 py-2.5 border-b border-slate-800/60">
            <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-xl p-3 border border-blue-500/20">
              <div className="text-xs font-semibold text-white truncate mb-1">{player.name}</div>
              <div className="text-xs text-slate-400 mb-2">{player.employment}</div>
              <div className="flex items-center justify-between">
                <div><div className="text-xs text-slate-500">Net Worth</div><div className="text-sm font-bold text-white">{formatCurrency(player.netWorth, true)}</div></div>
                <div className="text-right"><div className="text-xs text-slate-500">Cash</div><div className="text-sm font-bold text-emerald-400">{formatCurrency(player.money, true)}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ href, Icon, label }) => {
              const active = isActive(href);
              const showBadge = href === "/events" && activeEvents.length > 0;
              return (
                <Link key={href} href={href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative group ${active ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/80"}`}>
                    <Icon size={16} className="flex-shrink-0" />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium flex-1 truncate">{label}</motion.span>
                      )}
                    </AnimatePresence>
                    {showBadge && <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 animate-pulse" />}
                    {sidebarCollapsed && (
                      <div className="absolute left-12 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">{label}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Economy quick stats */}
        {economy && !sidebarCollapsed && (
          <div className="px-3 py-3 border-t border-slate-800/60">
            <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">World Economy</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Inflation",   value: `${economy.inflation.toFixed(1)}%`,   good: economy.inflation < 4 },
                { label: "Unemploy.",   value: `${economy.unemployment.toFixed(1)}%`, good: economy.unemployment < 6 },
                { label: "Int. Rate",   value: `${economy.interestRate.toFixed(1)}%`, good: economy.interestRate < 5 },
                { label: "GDP Growth",  value: `${economy.gdpGrowth > 0 ? "+" : ""}${economy.gdpGrowth.toFixed(1)}%`, good: economy.gdpGrowth > 0 },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/60 rounded-lg p-2">
                  <div className="text-xs text-slate-500">{s.label}</div>
                  <div className={`text-xs font-bold ${s.good ? "text-emerald-400" : "text-red-400"}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day */}
        {player && (
          <div className={`px-3 py-2.5 border-t border-slate-800/60 ${sidebarCollapsed ? "text-center" : ""}`}>
            {sidebarCollapsed ? (
              <div className="text-xs text-slate-500 font-mono">D{player.gameDay}</div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Day {player.gameDay}</span>
                <span>Year {2025 + Math.floor(player.gameDay / 365)}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Mobile bottom navigation bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 border-t border-slate-800/80 backdrop-blur-xl safe-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {BOTTOM_PRIMARY.map(({ href, Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className="flex-1" onClick={() => setMoreOpen(false)}>
                <div className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all ${active ? "text-blue-400" : "text-slate-500"}`}>
                  <Icon size={20} />
                  <span className="text-[10px] font-medium leading-none">{label.split(" ")[0]}</span>
                </div>
              </Link>
            );
          })}

          {/* More button */}
          <button className="flex-1" onClick={() => setMoreOpen((v) => !v)}>
            <div className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all ${moreOpen ? "text-blue-400" : "text-slate-500"}`}>
              {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
              <span className="text-[10px] font-medium leading-none">More</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Mobile "More" drawer ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800/60 rounded-t-3xl px-4 pt-4 pb-6 shadow-2xl"
            >
              {/* Player mini card */}
              {player && (
                <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-2xl p-3 border border-blue-500/20 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{player.name}</div>
                      <div className="text-xs text-slate-400">{player.employment} · Day {player.gameDay}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Cash</div>
                      <div className="text-base font-black text-emerald-400">{formatCurrency(player.money, true)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {BOTTOM_MORE.map(({ href, Icon, label }) => {
                  const active = isActive(href);
                  const showBadge = href === "/events" && activeEvents.length > 0;
                  return (
                    <Link key={href} href={href} onClick={() => setMoreOpen(false)}>
                      <div className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all ${active ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-slate-700/60 bg-slate-800/60 text-slate-400"}`}>
                        <div className="relative">
                          <Icon size={22} />
                          {showBadge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse border border-slate-900" />}
                        </div>
                        <span className="text-xs font-medium text-center leading-tight">{label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Economy snapshot */}
              {economy && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: "Inflation",  value: `${economy.inflation.toFixed(1)}%`,    good: economy.inflation < 4 },
                    { label: "Jobs",       value: `${economy.unemployment.toFixed(1)}%`, good: economy.unemployment < 6 },
                    { label: "Rate",       value: `${economy.interestRate.toFixed(1)}%`, good: economy.interestRate < 5 },
                    { label: "GDP",        value: `${economy.gdpGrowth > 0 ? "+" : ""}${economy.gdpGrowth.toFixed(1)}%`, good: economy.gdpGrowth > 0 },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-800/60 rounded-xl p-2 text-center">
                      <div className="text-[10px] text-slate-500">{s.label}</div>
                      <div className={`text-xs font-bold ${s.good ? "text-emerald-400" : "text-red-400"}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
