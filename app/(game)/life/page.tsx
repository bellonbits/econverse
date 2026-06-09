"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { calculateDailyExpenses } from "@/lib/economy-engine";
import { getEconomicPrinciple } from "@/lib/event-engine";
import { formatCurrency } from "@/lib/utils";
import {
  BookOpen, Briefcase, Monitor, Activity, Users, GraduationCap,
  Brain, Book, ChefHat, BarChart3, DollarSign, Smile, Heart,
  Home, UtensilsCrossed, Car, Zap, Stethoscope, Gamepad2,
  Lightbulb, ClipboardList, TrendingUp, Star, type LucideIcon,
} from "lucide-react";

const LIFESTYLE_ACTIONS = [
  { id: "study", Icon: BookOpen, label: "Study", description: "Increase education level and future earning potential", cost: 0, timeHours: 4, effects: { educationLevel: 0.05, happiness: -5, health: -2 }, category: "education" },
  { id: "work_part_time", Icon: Briefcase, label: "Work Part-Time", description: "Earn extra income through part-time work", cost: 0, earn: 80, timeHours: 8, effects: { happiness: -10, health: -5, reputation: 2 }, category: "work" },
  { id: "freelance", Icon: Monitor, label: "Freelance", description: "Use your skills to earn freelance income", cost: 0, earn: 150, timeHours: 6, effects: { happiness: 5, health: -3, reputation: 5, educationLevel: 0.02 }, category: "work" },
  { id: "exercise", Icon: Activity, label: "Exercise", description: "Boost your health and energy levels", cost: 20, timeHours: 2, effects: { health: 10, happiness: 8 }, category: "health" },
  { id: "socialize", Icon: Users, label: "Socialize", description: "Build your network and improve reputation", cost: 50, timeHours: 3, effects: { happiness: 15, reputation: 8, health: 2 }, category: "social" },
  { id: "online_course", Icon: GraduationCap, label: "Online Course", description: "Learn a new skill through an online platform", cost: 30, timeHours: 3, effects: { educationLevel: 0.1, happiness: 5, reputation: 3 }, category: "education" },
  { id: "meditation", Icon: Brain, label: "Meditate", description: "Reduce stress and improve mental health", cost: 0, timeHours: 1, effects: { happiness: 12, health: 5 }, category: "health" },
  { id: "read_books", Icon: Book, label: "Read Books", description: "Gain knowledge and improve financial literacy", cost: 15, timeHours: 2, effects: { educationLevel: 0.03, happiness: 8 }, category: "education" },
  { id: "cook_at_home", Icon: ChefHat, label: "Cook at Home", description: "Save money on food and improve health", cost: -30, timeHours: 1, effects: { happiness: 5, health: 5 }, category: "lifestyle" },
  { id: "invest_time", Icon: BarChart3, label: "Research Investments", description: "Become a better investor through research", cost: 0, timeHours: 2, effects: { educationLevel: 0.05, reputation: 2 }, category: "finance" },
];

const EXPENSE_ICONS: Record<string, LucideIcon> = {
  Food: UtensilsCrossed, Rent: Home, Transport: Car, Utilities: Zap, Healthcare: Stethoscope, Entertainment: Gamepad2,
};

const CATEGORY_COLORS: Record<string, string> = {
  education: "border-blue-500/30 bg-blue-500/10", work: "border-emerald-500/30 bg-emerald-500/10",
  health: "border-red-500/30 bg-red-500/10", social: "border-purple-500/30 bg-purple-500/10",
  lifestyle: "border-yellow-500/30 bg-yellow-500/10", finance: "border-cyan-500/30 bg-cyan-500/10",
};

const EFFECT_META: Record<string, { Icon: LucideIcon; label: string }> = {
  educationLevel: { Icon: BookOpen, label: "Edu" },
  happiness: { Icon: Smile, label: "Happy" },
  health: { Icon: Heart, label: "Health" },
  reputation: { Icon: Star, label: "Rep" },
};

const CATEGORIES = ["all", "education", "work", "health", "social", "lifestyle", "finance"];

export default function LifePage() {
  const { player, setPlayer, showNotification, addMentorMessage } = useGameStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [performing, setPerforming] = useState<string | null>(null);
  const [log, setLog] = useState<{ id: string; message: string }[]>([]);

  if (!player) return null;

  const expenses = calculateDailyExpenses(player.employment, player.country);
  const filteredActions = LIFESTYLE_ACTIONS.filter((a) => activeCategory === "all" || a.category === activeCategory);

  const performAction = async (action: typeof LIFESTYLE_ACTIONS[0]) => {
    if (performing) return;
    const actualCost = action.cost > 0 ? action.cost : 0;
    const savings = action.cost < 0 ? Math.abs(action.cost) : 0;
    if (actualCost > 0 && player.money < actualCost) { showNotification(`Need ${formatCurrency(actualCost)} to do this`, "error"); return; }

    setPerforming(action.id);
    await new Promise((r) => setTimeout(r, 800));

    const earn = (action as any).earn ?? 0;
    const moneyChange = earn - actualCost + savings;
    const updates = {
      money: player.money + moneyChange,
      happiness: Math.max(0, Math.min(100, player.happiness + (action.effects.happiness ?? 0))),
      health: Math.max(0, Math.min(100, player.health + (action.effects.health ?? 0))),
      reputation: Math.max(0, Math.min(100, player.reputation + (action.effects.reputation ?? 0))),
      educationLevel: Math.min(10, player.educationLevel + (action.effects.educationLevel ?? 0)),
    };
    setPlayer({ ...player, ...updates });

    const msg = earn > 0 ? `${action.label}: Earned ${formatCurrency(earn)}`
      : actualCost > 0 ? `${action.label}: Spent ${formatCurrency(actualCost)}`
      : savings > 0 ? `${action.label}: Saved ${formatCurrency(savings)}` : `${action.label}: Completed`;
    setLog((prev) => [{ id: Date.now().toString(), message: msg }, ...prev].slice(0, 10));

    if (action.id === "study" || action.id === "online_course") {
      const principle = getEconomicPrinciple("study");
      addMentorMessage({ id: Date.now().toString(), trigger: "study", title: principle.title, explanation: principle.explanation, principle: principle.principle, example: `Each education point increases your salary potential by ~5%.`, timestamp: Date.now() });
    }
    if (earn > 0) { showNotification(`Earned ${formatCurrency(earn)} from ${action.label}!`, "success"); }
    else { showNotification(`${action.label} complete!`, "info"); }
    setPerforming(null);
  };

  const surplusDeficit = player.salary / 365 - expenses.total;
  const VITALS = [
    { label: "Cash", value: formatCurrency(player.money, true), Icon: DollarSign, color: "text-emerald-400", bar: null },
    { label: "Happiness", value: `${player.happiness.toFixed(0)}%`, Icon: Smile, color: "text-yellow-400", bar: player.happiness, barColor: "#FBBF24" },
    { label: "Health", value: `${player.health.toFixed(0)}%`, Icon: Heart, color: "text-red-400", bar: player.health, barColor: "#F87171" },
    { label: "Education", value: `${(player.educationLevel * 10).toFixed(0)}%`, Icon: BookOpen, color: "text-blue-400", bar: player.educationLevel * 10, barColor: "#60A5FA" },
  ];
  const EXPENSE_ROWS = [
    { label: "Food", value: expenses.food }, { label: "Rent", value: expenses.rent },
    { label: "Transport", value: expenses.transportation }, { label: "Utilities", value: expenses.utilities },
    { label: "Healthcare", value: expenses.healthcare }, { label: "Entertainment", value: expenses.entertainment },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Home size={22} className="text-blue-400" /> Daily Life</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your time, health, and happiness</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {VITALS.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5"><s.Icon size={13} className={s.color} /><span className="text-xs text-slate-400">{s.label}</span></div>
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
            </div>
            {s.bar !== null && s.bar !== undefined && (
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.bar}%`, backgroundColor: (s as any).barColor }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><ClipboardList size={14} className="text-slate-400" /> Daily Cost of Living</h3>
          <span className="text-sm font-bold text-red-400">-{formatCurrency(expenses.total)}/day</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {EXPENSE_ROWS.map((e) => {
            const Icon = EXPENSE_ICONS[e.label] ?? Zap;
            return (
              <div key={e.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center mx-auto mb-1.5"><Icon size={13} className="text-slate-400" /></div>
                <div className="text-xs text-slate-400">{e.label}</div>
                <div className="text-sm font-bold text-red-400">{formatCurrency(e.value)}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-500">
          <span>Monthly: {formatCurrency(expenses.total * 30, true)}</span>
          <span>Annual: {formatCurrency(expenses.total * 365, true)}</span>
          {player.salary > 0 && (
            <span className={`font-medium ${surplusDeficit > 0 ? "text-emerald-400" : "text-red-400"}`}>
              Daily income: {formatCurrency(player.salary / 365)} — {surplusDeficit > 0 ? "Surplus" : "Deficit"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${activeCategory === cat ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{cat}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredActions.map((action) => {
              const earn = (action as any).earn ?? 0;
              const isPerforming = performing === action.id;
              const canAfford = action.cost <= 0 || player.money >= action.cost;
              return (
                <motion.button
                  key={action.id}
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                  whileTap={canAfford ? { scale: 0.98 } : {}}
                  onClick={() => canAfford && !performing && performAction(action)}
                  disabled={!canAfford || !!performing}
                  className={`p-4 rounded-2xl border text-left transition-all ${CATEGORY_COLORS[action.category]} ${!canAfford ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${isPerforming ? "animate-pulse" : ""}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <action.Icon size={20} className="text-current flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{action.label}</div>
                      <div className="text-xs text-slate-400">{action.timeHours}h · {action.category}</div>
                    </div>
                    {earn > 0 && <span className="text-xs font-bold text-emerald-400">+{formatCurrency(earn)}</span>}
                    {action.cost > 0 && <span className="text-xs font-bold text-red-400">-{formatCurrency(action.cost)}</span>}
                    {action.cost < 0 && <span className="text-xs font-bold text-emerald-400">saves {formatCurrency(Math.abs(action.cost))}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{action.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(action.effects).map(([key, val]) => {
                      if (!val) return null;
                      const meta = EFFECT_META[key];
                      if (!meta) return null;
                      const positive = val > 0;
                      return (
                        <span key={key} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                          <meta.Icon size={10} />
                          {positive ? "+" : ""}{typeof val === "number" && val < 1 ? `${(val * 100).toFixed(0)}%` : val} {meta.label}
                        </span>
                      );
                    })}
                  </div>
                  {isPerforming && (
                    <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-blue-500 rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ClipboardList size={13} className="text-slate-400" /> Activity Log</h3>
            {log.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No activities yet. Start doing things!</p>
            ) : (
              <div className="space-y-2">
                {log.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <span className="text-slate-300">{l.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">Opportunity Cost</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every choice you make has a hidden cost — the next best alternative you gave up. Studying instead of working means you gain future earning power but lose today's income. This trade-off is called <strong className="text-yellow-400">opportunity cost</strong> — a fundamental economics concept.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><TrendingUp size={13} className="text-slate-400" /> Progress</h3>
            <div className="space-y-3">
              {[
                { label: "Education Level", value: player.educationLevel, max: 10, color: "#3B82F6", suffix: "/10" },
                { label: "Reputation", value: player.reputation, max: 100, color: "#8B5CF6", suffix: "/100" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{p.label}</span>
                    <span className="text-white font-medium">{p.value.toFixed(1)}{p.suffix}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(p.value / p.max) * 100}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
