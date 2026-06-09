"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { CAREER_PATHS } from "@/lib/economy-engine";
import { formatCurrency } from "@/lib/utils";
import { Briefcase, BookOpen, BarChart3, TrendingUp, X, Lock, CheckCircle2 } from "lucide-react";

export default function CareerPage() {
  const { player, setPlayer, showNotification, addMentorMessage, economy } = useGameStore();
  const [selected, setSelected] = useState<typeof CAREER_PATHS[0] | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  if (!player) return null;

  const currentCareer = CAREER_PATHS.find((c) => c.title === player.employment);
  const laborDemand = economy ? (100 - economy.unemployment) / 100 : 0.95;

  const canApply = (career: typeof CAREER_PATHS[0]) => {
    if (career.requiredEducation === "None") return true;
    const eduMap: Record<string, number> = { "None": 0, "Vocational": 2, "High School": 1, "Associate": 3, "Bachelor's": 4, "Master's": 6, "Medical Degree": 8, "PhD": 9 };
    return player.educationLevel >= (eduMap[career.requiredEducation] ?? 0);
  };

  const handleApply = async (career: typeof CAREER_PATHS[0]) => {
    if (!canApply(career)) { showNotification("You need more education for this career", "error"); return; }
    setIsChanging(true);
    await new Promise((r) => setTimeout(r, 1000));

    const adjustedSalary = career.baseSalary * laborDemand * (1 + player.educationLevel * 0.05);
    setPlayer({ ...player, employment: career.title, salary: adjustedSalary });

    addMentorMessage({
      id: Date.now().toString(), trigger: "career_change",
      title: "Labor Markets & Human Capital",
      explanation: `You've entered the ${career.category} sector. Your salary of ${formatCurrency(adjustedSalary, true)}/yr reflects your education level, market demand, and the current ${(economy?.unemployment ?? 5).toFixed(1)}% unemployment rate. Lower unemployment = more worker bargaining power = higher wages.`,
      principle: "Human capital theory: Higher skills → higher productivity → higher wages.",
      example: `With ${(economy?.unemployment ?? 5).toFixed(1)}% unemployment, labor demand multiplier is ${(laborDemand * 100).toFixed(0)}%.`,
      timestamp: Date.now(),
    });

    showNotification(`You're now a ${career.title} earning ${formatCurrency(adjustedSalary, true)}/year!`, "success");
    setSelected(null);
    setIsChanging(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Briefcase size={22} className="text-blue-400" /> Career Center</h1>
        <p className="text-sm text-slate-400 mt-0.5">Choose your career path and advance your income</p>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-emerald-600/30 flex items-center justify-center border border-blue-500/20">
              <Briefcase size={26} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Current Position</div>
              <div className="text-xl font-bold text-white">{player.employment}</div>
              <div className="text-sm text-emerald-400 font-medium">{player.salary > 0 ? `${formatCurrency(player.salary, true)}/year` : "No salary yet"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div><div className="text-xs text-slate-500">Education Level</div><div className="text-lg font-bold text-blue-400">{player.educationLevel.toFixed(1)}/10</div></div>
            <div><div className="text-xs text-slate-500">Reputation</div><div className="text-lg font-bold text-purple-400">{player.reputation.toFixed(0)}/100</div></div>
          </div>
        </div>
        {player.salary > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/40 grid grid-cols-3 gap-4">
            <div className="text-center"><div className="text-xs text-slate-500">Monthly (after tax)</div><div className="font-bold text-white">{formatCurrency((player.salary * 0.78) / 12, true)}</div></div>
            <div className="text-center"><div className="text-xs text-slate-500">Daily</div><div className="font-bold text-white">{formatCurrency(player.salary / 365)}</div></div>
            <div className="text-center"><div className="text-xs text-slate-500">Income Tax (22%)</div><div className="font-bold text-red-400">{formatCurrency(player.salary * 0.22, true)}/yr</div></div>
          </div>
        )}
      </div>

      {economy && (
        <div className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-white">Labor Market Conditions</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Unemployment Rate</div>
              <div className={`font-bold ${economy.unemployment < 5 ? "text-yellow-400" : "text-emerald-400"}`}>
                {economy.unemployment.toFixed(1)}% {economy.unemployment < 4 ? "— Tight Market" : economy.unemployment < 6 ? "— Normal" : "— Loose Market"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Wage Pressure</div>
              <div className={`font-bold flex items-center gap-1 ${economy.gdpGrowth > 2 ? "text-emerald-400" : "text-slate-400"}`}>
                {economy.gdpGrowth > 2 ? <><TrendingUp size={12} /> Rising wages</> : "Stable wages"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Salary Multiplier</div>
              <div className="font-bold text-white">{(laborDemand * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAREER_PATHS.map((career) => {
          const eligible = canApply(career);
          const isCurrent = player.employment === career.title;
          const adjustedSalary = career.baseSalary * laborDemand * (1 + player.educationLevel * 0.05);

          return (
            <motion.div
              key={career.id}
              whileHover={eligible && !isCurrent ? { scale: 1.02 } : {}}
              className={`glass-card rounded-2xl p-5 transition-all ${isCurrent ? "border-emerald-500/40 bg-emerald-500/5" : ""} ${!eligible ? "opacity-60" : ""} ${eligible && !isCurrent ? "hover:border-blue-500/30 cursor-pointer" : ""}`}
              onClick={() => eligible && !isCurrent && setSelected(career)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-400 capitalize">{career.category}</div>
                  <div className="text-lg font-bold text-white">{career.title}</div>
                </div>
                {isCurrent && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30"><CheckCircle2 size={10} /> Current</span>}
                {!eligible && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-xs"><Lock size={10} /> Locked</span>}
              </div>

              <p className="text-xs text-slate-400 mb-4">{career.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-800/60 rounded-lg p-2"><div className="text-xs text-slate-500">Base Salary</div><div className="text-sm font-bold text-emerald-400">{formatCurrency(career.baseSalary, true)}</div></div>
                <div className="bg-slate-800/60 rounded-lg p-2"><div className="text-xs text-slate-500">Your Offer</div><div className={`text-sm font-bold ${eligible ? "text-blue-400" : "text-slate-500"}`}>{eligible ? formatCurrency(adjustedSalary, true) : "N/A"}</div></div>
                <div className="bg-slate-800/60 rounded-lg p-2"><div className="text-xs text-slate-500">Growth</div><div className="text-sm font-bold text-purple-400">+{career.growthRate}%/yr</div></div>
                <div className="bg-slate-800/60 rounded-lg p-2"><div className="text-xs text-slate-500">Stress Level</div><div className={`text-sm font-bold ${career.stressLevel > 70 ? "text-red-400" : career.stressLevel > 40 ? "text-yellow-400" : "text-emerald-400"}`}>{career.stressLevel}/100</div></div>
              </div>

              <div className="text-xs text-slate-500 mb-2">Required: {career.requiredEducation}</div>
              <div className="flex flex-wrap gap-1">
                {career.promotionPaths.map((p) => <span key={p} className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 text-xs">→ {p}</span>)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-slate-400">{selected.category}</div>
                  <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-1">Your Salary Offer</div>
                  <div className="text-2xl font-black text-emerald-400">{formatCurrency(selected.baseSalary * laborDemand * (1 + player.educationLevel * 0.05), true)}/yr</div>
                  <div className="text-xs text-slate-500 mt-1">Base: {formatCurrency(selected.baseSalary, true)} × {(laborDemand * 100).toFixed(0)}% demand × edu bonus</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[{ k: "Growth Rate", v: `+${selected.growthRate}%/yr` }, { k: "Stress Level", v: `${selected.stressLevel}/100` }, { k: "Market Demand", v: `${selected.demandLevel}/100` }, { k: "Education Req.", v: selected.requiredEducation }].map((i) => (
                    <div key={i.k} className="bg-slate-800/60 rounded-lg p-3"><div className="text-slate-500 text-xs">{i.k}</div><div className="font-bold text-white">{i.v}</div></div>
                  ))}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1.5">Promotion Paths</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.promotionPaths.map((p) => <span key={p} className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 text-xs border border-blue-500/20">→ {p}</span>)}
                  </div>
                </div>
              </div>

              <button onClick={() => handleApply(selected)} disabled={isChanging} className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                {isChanging ? "Processing..." : `Accept Position as ${selected.title}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
