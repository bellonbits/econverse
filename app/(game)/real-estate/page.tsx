"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { formatCurrency } from "@/lib/utils";
import { getEconomicPrinciple } from "@/lib/event-engine";
import {
  Building2, Home, Store, Leaf, DollarSign, Key, BarChart3,
  Landmark, Building, X, TrendingUp,
} from "lucide-react";

const PROPERTIES_FOR_SALE = [
  { id: "apt1",   name: "Downtown Studio",     type: "apartment",  price: 120000,  rent: 1200, city: "Metro City", desc: "Compact studio in the heart of downtown. High rental demand.",     appreciation: 3.5 },
  { id: "house1", name: "Suburban Family Home", type: "house",      price: 280000,  rent: 2200, city: "Metro City", desc: "3-bedroom home in quiet suburb. Great for appreciation.",            appreciation: 4.2 },
  { id: "apt2",   name: "Luxury Penthouse",     type: "apartment",  price: 850000,  rent: 6500, city: "Metro City", desc: "Premium penthouse with city views. Top-tier rental income.",          appreciation: 5.1 },
  { id: "comm1",  name: "Retail Space",         type: "commercial", price: 350000,  rent: 4000, city: "Metro City", desc: "Ground floor retail space. Ideal for business tenants.",             appreciation: 2.8 },
  { id: "house2", name: "Beach Cottage",        type: "house",      price: 195000,  rent: 1800, city: "Metro City", desc: "Cozy beach cottage. Seasonal rental income potential.",              appreciation: 5.8 },
  { id: "land1",  name: "Development Land",     type: "land",       price: 75000,   rent: 0,    city: "Metro City", desc: "Undeveloped plot for future construction. Pure appreciation play.", appreciation: 6.5 },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  apartment: Building2, house: Home, commercial: Store, land: Leaf,
};

export default function RealEstatePage() {
  const { player, setPlayer, properties, setProperties, showNotification, addMentorMessage, economy } = useGameStore();
  const [showBuyModal, setShowBuyModal] = useState<typeof PROPERTIES_FOR_SALE[0] | null>(null);
  const [useMortgage, setUseMortgage] = useState(true);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [isBuying, setIsBuying] = useState(false);

  if (!player) return null;

  const downPayment = showBuyModal ? showBuyModal.price * (downPaymentPct / 100) : 0;
  const mortgageAmount = showBuyModal ? showBuyModal.price - downPayment : 0;
  const mortgageRate = (economy?.interestRate ?? 5.25) + 1.5;
  const monthlyMortgage = mortgageAmount > 0 ? (mortgageAmount * (mortgageRate / 100 / 12)) / (1 - Math.pow(1 + mortgageRate / 100 / 12, -360)) : 0;
  const capRate = showBuyModal ? ((showBuyModal.rent * 12) / showBuyModal.price) * 100 : 0;
  const cashFlow = showBuyModal ? showBuyModal.rent - monthlyMortgage - (showBuyModal.price * 0.01 / 12) : 0;

  const handleBuy = async () => {
    if (!showBuyModal || !player) return;
    const requiredCash = useMortgage ? downPayment : showBuyModal.price;
    if (player.money < requiredCash) { showNotification(`Need ${formatCurrency(requiredCash)} cash`, "error"); return; }

    setIsBuying(true);
    await new Promise((r) => setTimeout(r, 800));

    const newProperty = {
      id: `prop_${Date.now()}`, playerId: player.id, name: showBuyModal.name,
      type: showBuyModal.type as any, purchasePrice: showBuyModal.price,
      currentValue: showBuyModal.price, monthlyRent: 0, isRented: false, city: showBuyModal.city,
    };
    setProperties([...properties, newProperty]);
    setPlayer({ ...player, money: player.money - requiredCash, debt: useMortgage ? player.debt + mortgageAmount : player.debt });

    const principle = getEconomicPrinciple("buy_property");
    addMentorMessage({ id: Date.now().toString(), trigger: "buy_property", title: principle.title, explanation: principle.explanation, principle: principle.principle, example: `${showBuyModal.name}: Cap rate ${capRate.toFixed(1)}%, monthly cash flow ${formatCurrency(cashFlow)}. ${useMortgage ? `Mortgage: ${formatCurrency(mortgageAmount, true)} at ${mortgageRate.toFixed(1)}%` : "Bought outright."}`, timestamp: Date.now() });
    showNotification(`Purchased ${showBuyModal.name}!`, "success");
    setShowBuyModal(null); setIsBuying(false);
  };

  const totalPropertyValue = properties.reduce((s, p) => s + p.currentValue, 0);
  const totalRentalIncome = properties.filter((p) => p.isRented).reduce((s, p) => s + p.monthlyRent, 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Building size={22} className="text-blue-400" /> Real Estate</h1>
        <p className="text-sm text-slate-400 mt-0.5">Buy, rent, and develop properties</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Portfolio Value", value: formatCurrency(totalPropertyValue, true), Icon: Home, color: "text-yellow-400" },
          { label: "Rental Income", value: `${formatCurrency(totalRentalIncome)}/mo`, Icon: DollarSign, color: "text-emerald-400" },
          { label: "Properties", value: properties.length.toString(), Icon: Key, color: "text-blue-400" },
          { label: "Housing Index", value: `${economy?.housingIndex.toFixed(0) ?? "—"}`, Icon: BarChart3, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1"><s.Icon size={14} className={s.color} /><span className="text-xs text-slate-400">{s.label}</span></div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {properties.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Your Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((prop) => {
              const Icon = TYPE_ICONS[prop.type] ?? Home;
              return (
                <div key={prop.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-slate-400" />
                      <div><div className="font-semibold text-white">{prop.name}</div><div className="text-xs text-slate-400 capitalize">{prop.type} · {prop.city}</div></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${prop.isRented ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>{prop.isRented ? "Rented" : "Vacant"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><div className="text-slate-500">Value</div><div className="font-bold text-white">{formatCurrency(prop.currentValue, true)}</div></div>
                    <div><div className="text-slate-500">Purchased</div><div className="font-bold text-slate-300">{formatCurrency(prop.purchasePrice, true)}</div></div>
                    <div><div className="text-slate-500">Gain/Loss</div><div className={`font-bold ${prop.currentValue >= prop.purchasePrice ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(prop.currentValue - prop.purchasePrice, true)}</div></div>
                  </div>
                  {!prop.isRented && prop.type !== "land" && (
                    <button className="mt-3 w-full py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">List for Rent</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Properties for Sale</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROPERTIES_FOR_SALE.map((prop) => {
            const already = properties.some((p) => p.name === prop.name);
            const pCapRate = ((prop.rent * 12) / prop.price) * 100;
            const canAfford = player.money >= prop.price * 0.2;
            const Icon = TYPE_ICONS[prop.type] ?? Home;
            return (
              <motion.div key={prop.id} whileHover={!already ? { scale: 1.02 } : {}}
                className={`bg-slate-800/60 rounded-xl p-4 border transition-all ${already ? "border-emerald-500/30 opacity-60" : "border-slate-700/40 hover:border-blue-500/30 cursor-pointer"}`}
                onClick={() => !already && canAfford && setShowBuyModal(prop)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-slate-300" />
                    <div><div className="text-sm font-bold text-white">{prop.name}</div><div className="text-xs text-slate-400 capitalize">{prop.type}</div></div>
                  </div>
                  {already && <span className="text-xs text-emerald-400 font-bold">Owned</span>}
                </div>
                <p className="text-xs text-slate-400 mb-3">{prop.desc}</p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-700/60 rounded-lg p-2"><div className="text-slate-500">Price</div><div className="font-bold text-white">{formatCurrency(prop.price, true)}</div></div>
                  <div className="bg-slate-700/60 rounded-lg p-2"><div className="text-slate-500">Monthly Rent</div><div className="font-bold text-emerald-400">{prop.rent > 0 ? formatCurrency(prop.rent) : "N/A"}</div></div>
                  <div className="bg-slate-700/60 rounded-lg p-2"><div className="text-slate-500">Cap Rate</div><div className={`font-bold ${pCapRate > 5 ? "text-emerald-400" : "text-yellow-400"}`}>{pCapRate.toFixed(1)}%</div></div>
                  <div className="bg-slate-700/60 rounded-lg p-2"><div className="text-slate-500">Appreciation</div><div className="font-bold text-blue-400 flex items-center gap-1"><TrendingUp size={10} />{prop.appreciation}%/yr</div></div>
                </div>
                {!already && (
                  <div className={`text-center text-xs py-2 rounded-lg font-medium ${canAfford ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "bg-slate-700/40 text-slate-500"}`}>
                    {canAfford ? `20% down: ${formatCurrency(prop.price * 0.2, true)}` : `Need ${formatCurrency(prop.price * 0.2, true)} for 20% down`}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showBuyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowBuyModal(null)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => { const Icon = TYPE_ICONS[showBuyModal.type] ?? Home; return <Icon size={22} className="text-slate-300" />; })()}
                  <div><h2 className="text-xl font-bold text-white">{showBuyModal.name}</h2><div className="text-xs text-slate-400">{formatCurrency(showBuyModal.price)}</div></div>
                </div>
                <button onClick={() => setShowBuyModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="flex gap-2 mb-4 bg-slate-800 rounded-xl p-1">
                <button onClick={() => setUseMortgage(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${useMortgage ? "bg-blue-600 text-white" : "text-slate-400"}`}><Landmark size={14} /> Mortgage</button>
                <button onClick={() => setUseMortgage(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${!useMortgage ? "bg-emerald-600 text-white" : "text-slate-400"}`}><DollarSign size={14} /> Cash</button>
              </div>

              {useMortgage && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2"><span className="text-slate-400">Down Payment: {downPaymentPct}%</span><span className="font-bold text-white">{formatCurrency(downPayment, true)}</span></div>
                  <input type="range" min={5} max={50} step={5} value={downPaymentPct} onChange={(e) => setDownPaymentPct(parseInt(e.target.value))} className="w-full accent-blue-500" />
                  <div className="flex justify-between text-xs text-slate-500"><span>5%</span><span>50%</span></div>
                </div>
              )}

              <div className="space-y-2 mb-4 text-sm">
                {useMortgage ? (
                  <>
                    <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Cash Needed (Down)</span><span className={`font-bold ${player.money >= downPayment ? "text-white" : "text-red-400"}`}>{formatCurrency(downPayment, true)}</span></div>
                    <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Mortgage Amount</span><span className="font-bold text-white">{formatCurrency(mortgageAmount, true)}</span></div>
                    <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Mortgage Rate</span><span className="font-bold text-yellow-400">{mortgageRate.toFixed(2)}%</span></div>
                    <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Monthly Payment</span><span className="font-bold text-red-400">{formatCurrency(monthlyMortgage)}</span></div>
                    <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Net Monthly Cash Flow</span><span className={`font-bold ${cashFlow > 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(cashFlow)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Total Cash Required</span><span className={`font-bold ${player.money >= showBuyModal.price ? "text-white" : "text-red-400"}`}>{formatCurrency(showBuyModal.price, true)}</span></div>
                )}
                <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Cap Rate</span><span className="font-bold text-blue-400">{capRate.toFixed(1)}%</span></div>
                <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-lg"><span className="text-slate-400">Expected Appreciation</span><span className="font-bold text-emerald-400">+{showBuyModal.appreciation}%/yr</span></div>
              </div>

              <button onClick={handleBuy} disabled={isBuying || player.money < (useMortgage ? downPayment : showBuyModal.price)}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Home size={16} /> {isBuying ? "Processing..." : `Purchase ${showBuyModal.name}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
