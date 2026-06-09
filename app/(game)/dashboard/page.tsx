"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency, formatPercent, gameDayToDate } from "@/lib/utils";
import { getEconomyPhase, getEconomyHealthScore } from "@/lib/economy-engine";
import {
  Gem, TrendingUp, Building2, CreditCard, Globe, Flame,
  Smile, Heart, BookOpen, Star, TrendingDown, BarChart3,
  Briefcase, CheckCircle2, Zap,
} from "lucide-react";

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const PHASE_ICONS: Record<string, React.ElementType> = {
  expansion: TrendingUp, boom: TrendingUp, recession: TrendingDown,
  contraction: TrendingDown, recovery: BarChart3, peak: BarChart3,
};

const TX_ICONS: Record<string, React.ElementType> = {
  salary: Briefcase, expense: CreditCard, investment: TrendingUp,
  business: Building2, loan: Gem, default: BarChart3,
};

export default function DashboardPage() {
  const { player, economy, businesses, investments, properties, loans, bankAccounts, markets, activeEvents } = useGameStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!player) return;
    fetch(`/api/transactions?playerId=${player.id}&limit=20`)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []));

    const history = [];
    for (let i = Math.max(0, player.gameDay - 30); i <= player.gameDay; i += 5) {
      history.push({ day: `D${i}`, netWorth: player.netWorth * (0.85 + (i / player.gameDay) * 0.15), cash: player.money });
    }
    history[history.length - 1] = { day: `D${player.gameDay}`, netWorth: player.netWorth, cash: player.money };
    setNetWorthHistory(history);
  }, [player]);

  if (!player || !economy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <BarChart3 size={24} className="text-blue-400" />
          </div>
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const economyPhase = getEconomyPhase(economy);
  const economyHealth = getEconomyHealthScore(economy);
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalPropertyValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
  const totalBusinessValue = businesses.reduce((sum, b) => sum + Math.max(0, (b.revenue - b.expenses) * 365 * 3), 0);
  const totalDebt = loans.reduce((sum, l) => sum + l.remaining, 0);
  const totalSavings = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const portfolioData = [
    { name: "Cash", value: player.money, color: "#10B981" },
    { name: "Savings", value: totalSavings, color: "#3B82F6" },
    { name: "Investments", value: totalInvestmentValue, color: "#8B5CF6" },
    { name: "Properties", value: totalPropertyValue, color: "#F59E0B" },
    { name: "Business", value: totalBusinessValue, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const PHASE_COLORS: Record<string, string> = {
    expansion: "text-emerald-400 bg-emerald-400/10", boom: "text-green-400 bg-green-400/10",
    recession: "text-red-400 bg-red-400/10", contraction: "text-orange-400 bg-orange-400/10",
    recovery: "text-blue-400 bg-blue-400/10", peak: "text-yellow-400 bg-yellow-400/10",
  };

  const PhaseIcon = PHASE_ICONS[economyPhase] ?? BarChart3;
  const topMarkets = [...markets].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);

  const METRIC_CARDS = [
    { label: "Net Worth", value: formatCurrency(player.netWorth, true), sub: `Cash: ${formatCurrency(player.money, true)}`, Icon: Gem, color: "from-blue-600/20 to-blue-800/20 border-blue-500/20", textColor: "text-blue-400" },
    { label: "Investments", value: formatCurrency(totalInvestmentValue, true), sub: `${investments.length} positions`, Icon: TrendingUp, color: "from-purple-600/20 to-purple-800/20 border-purple-500/20", textColor: "text-purple-400" },
    { label: "Business Revenue", value: formatCurrency(businesses.reduce((s, b) => s + b.revenue, 0) * 30, true), sub: `${businesses.length} businesses`, Icon: Building2, color: "from-emerald-600/20 to-emerald-800/20 border-emerald-500/20", textColor: "text-emerald-400" },
    { label: "Total Debt", value: formatCurrency(totalDebt, true), sub: `${loans.filter((l) => !l.isPaid).length} active loans`, Icon: CreditCard, color: totalDebt > 0 ? "from-red-600/20 to-red-800/20 border-red-500/20" : "from-slate-600/20 to-slate-800/20 border-slate-500/20", textColor: totalDebt > 0 ? "text-red-400" : "text-slate-400" },
  ];

  const LIFE_STATS = [
    { label: "Happiness", value: player.happiness, Icon: Smile, color: "#F59E0B" },
    { label: "Health", value: player.health, Icon: Heart, color: "#EF4444" },
    { label: "Education", value: player.educationLevel * 10, Icon: BookOpen, color: "#3B82F6" },
    { label: "Reputation", value: player.reputation, Icon: Star, color: "#8B5CF6" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div {...FADE_UP} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {player.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{gameDayToDate(player.gameDay)} · Day {player.gameDay}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold capitalize border ${PHASE_COLORS[economyPhase] ?? "text-slate-400"} border-current/20`}>
          <PhaseIcon size={14} />
          {economyPhase}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRIC_CARDS.map((m) => (
          <div key={m.label} className={`rounded-2xl p-5 bg-gradient-to-br ${m.color} border backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <m.Icon size={16} className={m.textColor} />
              <span className="text-xs text-slate-400 font-medium">{m.label}</span>
            </div>
            <div className={`text-2xl font-black ${m.textColor} font-mono`}>{m.value}</div>
            <div className="text-xs text-slate-500 mt-1">{m.sub}</div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Net Worth History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={netWorthHistory}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => formatCurrency(v, true)} />
              <Tooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px" }} formatter={(v: number) => [formatCurrency(v), "Net Worth"]} />
              <Area type="monotone" dataKey="netWorth" stroke="#3B82F6" strokeWidth={2} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Portfolio Breakdown</h3>
          {portfolioData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {portfolioData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px" }} formatter={(v: number) => [formatCurrency(v, true)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {portfolioData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-slate-400">{d.name}</span></div>
                    <span className="text-white font-medium">{formatCurrency(d.value, true)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40"><p className="text-slate-500 text-xs text-center">Start investing to see your<br />portfolio breakdown</p></div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe size={14} className="text-blue-400" /> Economy Indicators</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: economyHealth > 70 ? "#10B981" : economyHealth > 40 ? "#F59E0B" : "#EF4444" }} />
              <span className="text-xs text-slate-400">Health: {economyHealth.toFixed(0)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "GDP Growth", value: `${economy.gdpGrowth > 0 ? "+" : ""}${economy.gdpGrowth.toFixed(2)}%`, good: economy.gdpGrowth > 0 },
              { label: "Inflation", value: `${economy.inflation.toFixed(1)}%`, good: economy.inflation < 3 },
              { label: "Unemployment", value: `${economy.unemployment.toFixed(1)}%`, good: economy.unemployment < 5 },
              { label: "Interest Rate", value: `${economy.interestRate.toFixed(2)}%`, good: economy.interestRate < 5 },
              { label: "Consumer Confidence", value: `${economy.consumerConfidence.toFixed(0)}/100`, good: economy.consumerConfidence > 60 },
              { label: "Stock Index", value: economy.stockMarketIndex.toFixed(0), good: true },
            ].map((ind) => (
              <div key={ind.label} className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">{ind.label}</div>
                <div className={`text-base font-bold ${ind.good ? "text-emerald-400" : "text-red-400"}`}>{ind.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Flame size={14} className="text-orange-400" /> Market Movers</h3>
          <div className="space-y-2">
            {topMarkets.map((m) => (
              <div key={m.symbol} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white">{m.symbol.slice(0, 2)}</div>
                  <div><div className="text-sm font-semibold text-white">{m.symbol}</div><div className="text-xs text-slate-500 truncate max-w-28">{m.name}</div></div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">${m.price < 1000 ? m.price.toFixed(2) : m.price.toFixed(0)}</div>
                  <div className={`text-xs font-bold ${m.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>{m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><CreditCard size={14} className="text-slate-400" /> Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No transactions yet. Start playing!</p>
            ) : (
              transactions.slice(0, 8).map((tx) => {
                const TxIcon = TX_ICONS[tx.type] ?? TX_ICONS.default;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/50 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                        <TxIcon size={13} className={tx.amount > 0 ? "text-emerald-400" : "text-red-400"} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">{tx.description}</div>
                        <div className="text-xs text-slate-500">Day {tx.gameDay}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold font-mono flex-shrink-0 ${tx.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(tx.amount), true)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> Active Economic Events</h3>
          {activeEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Economy is stable. No active disruptions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeEvents.map((event) => (
                <div key={event.id} className={`p-3 rounded-xl border ${event.severity >= 5 ? "border-red-500/30 bg-red-500/5" : event.severity >= 3 ? "border-yellow-500/30 bg-yellow-500/5" : "border-blue-500/30 bg-blue-500/5"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${event.severity >= 5 ? "bg-red-400" : event.severity >= 3 ? "bg-yellow-400" : "bg-blue-400"} animate-pulse`} />
                    <span className="text-sm font-bold text-white">{event.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Character Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LIFE_STATS.map((stat) => (
            <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <stat.Icon size={13} style={{ color: stat.color }} />
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <span className="text-xs font-bold text-white">{stat.value.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stat.value}%`, backgroundColor: stat.color }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
