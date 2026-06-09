"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { BUSINESS_TEMPLATES } from "@/lib/economy-engine";
import { getEconomicPrinciple } from "@/lib/event-engine";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import {
  Building2, Users, ClipboardList, ArrowUp, Rocket, X,
  TrendingUp, TrendingDown, ArrowRight, Flame, BarChart3,
  Store, Zap,
} from "lucide-react";

const BIZ_ICONS: Record<string, React.ElementType> = {
  retail: Store, technology: Zap, food_service: Flame,
  manufacturing: Building2, consulting: BarChart3, real_estate: Building2,
};

export default function BusinessPage() {
  const { player, setPlayer, businesses, addBusiness, addMentorMessage, showNotification, economy } = useGameStore();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!player || !selectedTemplate) return;
    const template = BUSINESS_TEMPLATES.find((t) => t.category === selectedTemplate);
    if (!template) return;
    if (player.money < template.startCost) { showNotification(`Need ${formatCurrency(template.startCost)} to start this business`, "error"); return; }

    setIsCreating(true);
    try {
      const res = await fetch("/api/business", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: player.id, category: selectedTemplate, name: businessName || template.name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addBusiness(data.business);
      setPlayer({ ...player, money: player.money - template.startCost });

      const principle = getEconomicPrinciple("start_business");
      addMentorMessage({ id: Date.now().toString(), trigger: "start_business", title: principle.title, explanation: principle.explanation, principle: principle.principle, example: `You just invested ${formatCurrency(template.startCost)} into your ${selectedTemplate} business.`, timestamp: Date.now() });

      showNotification(`${businessName || template.name} launched!`, "success");
      setShowCreate(false); setSelectedTemplate(null); setBusinessName("");
    } catch (err: any) {
      showNotification(err.message ?? "Failed to create business", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Building2 size={22} className="text-blue-400" /> Business Empire</h1>
          <p className="text-sm text-slate-400 mt-0.5">Build and manage your businesses</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          + Start New Business
        </button>
      </div>

      {economy && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-white">Market Conditions</span>
            <span className="text-xs text-slate-500">— How the economy affects your business</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Consumer Demand", value: economy.consumerConfidence > 70 ? "High" : economy.consumerConfidence > 50 ? "Normal" : "Low", Icon: economy.consumerConfidence > 70 ? TrendingUp : TrendingDown, good: economy.consumerConfidence > 60 },
              { label: "Price Pressure", value: economy.inflation > 4 ? "Rising" : economy.inflation > 2 ? "Stable" : "Falling", Icon: economy.inflation > 2 ? ArrowUp : TrendingDown, good: economy.inflation < 3 },
              { label: "Labor Market", value: economy.unemployment < 4 ? "Tight" : economy.unemployment < 6 ? "Normal" : "Loose", Icon: Users, good: economy.unemployment >= 4 },
              { label: "Loan Rates", value: `${economy.interestRate.toFixed(1)}%`, Icon: BarChart3, good: economy.interestRate < 5 },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/60 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-sm font-bold flex items-center gap-1.5 ${s.good ? "text-emerald-400" : "text-red-400"}`}>
                  <s.Icon size={12} /> {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4"><Building2 size={32} className="text-blue-400" /></div>
          <h3 className="text-xl font-bold text-white mb-2">No businesses yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">Start your first business to generate income, hire employees, and learn how supply and demand work in practice.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all flex items-center gap-2 mx-auto">
            Start Your First Business <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((biz) => {
            const BizIcon = BIZ_ICONS[biz.category] ?? Building2;
            return (
              <motion.div key={biz.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-5 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-emerald-600/30 flex items-center justify-center border border-blue-500/20">
                      <BizIcon size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{biz.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{biz.category.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold">Lvl {biz.level}</span>
                    <span className={`w-2 h-2 rounded-full ${biz.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-800/60 rounded-xl p-3"><div className="text-xs text-slate-500">Daily Revenue</div><div className="text-base font-bold text-emerald-400">{formatCurrency(biz.revenue)}</div></div>
                  <div className="bg-slate-800/60 rounded-xl p-3"><div className="text-xs text-slate-500">Daily Expenses</div><div className="text-base font-bold text-red-400">{formatCurrency(biz.expenses)}</div></div>
                  <div className="bg-slate-800/60 rounded-xl p-3"><div className="text-xs text-slate-500">Daily Profit</div><div className={`text-base font-bold ${biz.profit >= 0 ? "text-blue-400" : "text-red-400"}`}>{formatCurrency(biz.profit)}</div></div>
                  <div className="bg-slate-800/60 rounded-xl p-3"><div className="text-xs text-slate-500">Customers</div><div className="text-base font-bold text-purple-400">{biz.customers}</div></div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{biz.employees?.length ?? 0} employees</span>
                  <span>Monthly: {formatCurrency(biz.profit * 30, true)}</span>
                  <span>Annual: {formatCurrency(biz.profit * 365, true)}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/40 flex gap-2">
                  <button className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all font-medium flex items-center justify-center gap-1.5"><ClipboardList size={11} /> Manage</button>
                  <button className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all font-medium flex items-center justify-center gap-1.5"><Users size={11} /> Hire Staff</button>
                  <button className="flex-1 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-xs text-blue-400 transition-all font-medium border border-blue-500/20 flex items-center justify-center gap-1.5"><ArrowUp size={11} /> Upgrade</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Start a Business</h2>
                  <p className="text-sm text-slate-400 mt-0.5">You have {formatCurrency(player?.money ?? 0, true)} available</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {BUSINESS_TEMPLATES.map((t) => {
                  const canAfford = (player?.money ?? 0) >= t.startCost;
                  const TIcon = BIZ_ICONS[t.category] ?? Building2;
                  return (
                    <button key={t.category} onClick={() => canAfford && setSelectedTemplate(t.category)} disabled={!canAfford}
                      className={`p-4 rounded-2xl border text-left transition-all ${selectedTemplate === t.category ? "border-blue-500 bg-blue-500/15" : canAfford ? "border-slate-700/60 bg-slate-800/50 hover:border-slate-600" : "border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed"}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center"><TIcon size={17} className="text-blue-400" /></div>
                        <div><div className="font-semibold text-white text-sm">{t.name}</div><div className="text-xs text-slate-400 capitalize">{t.category.replace("_", " ")}</div></div>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">{t.description}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><div className="text-slate-500">Start Cost</div><div className={`font-bold ${canAfford ? "text-white" : "text-red-400"}`}>{formatCurrency(t.startCost, true)}</div></div>
                        <div><div className="text-slate-500">Revenue/day</div><div className="font-bold text-emerald-400">{formatCurrency(t.baseRevenue)}</div></div>
                        <div><div className="text-slate-500">Profit/day</div><div className="font-bold text-blue-400">{formatCurrency(t.baseRevenue - t.baseExpenses)}</div></div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300 block mb-2">Business Name (optional)</label>
                    <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={BUSINESS_TEMPLATES.find((t) => t.category === selectedTemplate)?.name ?? ""} className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm" />
                  </div>
                  <button onClick={handleCreate} disabled={isCreating} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <Rocket size={16} /> {isCreating ? "Launching..." : "Launch Business"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
