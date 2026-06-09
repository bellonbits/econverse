"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { calculatePortfolioReturn, getMentorMessageForMarket } from "@/lib/market-engine";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingCart, DollarSign, X } from "lucide-react";

const TYPE_FILTERS = ["all", "stock", "etf", "bond", "commodity"] as const;

export default function InvestmentsPage() {
  const { player, setPlayer, investments, setInvestments, markets, addMentorMessage, showNotification } = useGameStore();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [isTrading, setIsTrading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const hist: Record<string, number[]> = {};
    markets.forEach((m) => {
      const base = m.price;
      hist[m.symbol] = Array.from({ length: 30 }, (_, i) => base * (0.85 + Math.random() * 0.3 + (i / 30) * 0.15));
      hist[m.symbol].push(base);
    });
    setPriceHistory(hist);
  }, [markets.length]);

  const filteredMarkets = markets.filter((m) => activeFilter === "all" || m.type === activeFilter);
  const portfolio = calculatePortfolioReturn(investments.map((inv) => ({ buyPrice: inv.buyPrice, currentPrice: inv.currentPrice, quantity: inv.quantity })));

  const handleTrade = async () => {
    if (!player || !selectedAsset) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { showNotification("Enter a valid quantity", "error"); return; }

    setIsTrading(true);
    try {
      const res = await fetch("/api/investments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, playerId: player.id, symbol: selectedAsset.symbol, quantity: qty }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const invRes = await fetch(`/api/investments?playerId=${player.id}`);
      const invData = await invRes.json();
      if (invData.investments) setInvestments(invData.investments);

      const cost = selectedAsset.price * qty;
      setPlayer({ ...player, money: action === "buy" ? player.money - cost : player.money + cost });

      const mentorMsg = getMentorMessageForMarket(action, selectedAsset, data.gainLossPercent);
      if (mentorMsg) {
        addMentorMessage({ id: Date.now().toString(), trigger: `${action}_${selectedAsset.type}`, title: action === "buy" ? `Bought ${selectedAsset.name}` : `Sold ${selectedAsset.name}`, explanation: mentorMsg, principle: action === "buy" ? "Buy assets, not liabilities." : "Realized gains are real gains.", example: "", timestamp: Date.now() });
      }

      showNotification(data.message ?? `${action === "buy" ? "Bought" : "Sold"} ${qty} ${selectedAsset.symbol}`, "success");
      setSelectedAsset(null); setQuantity("1");
    } catch (err: any) {
      showNotification(err.message ?? "Trade failed", "error");
    } finally {
      setIsTrading(false);
    }
  };

  const myPositions = investments.map((inv) => {
    const market = markets.find((m) => m.symbol === inv.symbol);
    return { ...inv, currentPrice: market?.price ?? inv.currentPrice };
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp size={22} className="text-blue-400" /> Investment Portfolio</h1>
          <p className="text-sm text-slate-400 mt-0.5">Stocks, ETFs, Bonds &amp; Commodities</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Portfolio Value</div>
          <div className="text-xl font-black text-white font-mono">{formatCurrency(portfolio.totalValue, true)}</div>
          <div className={`text-xs font-bold ${portfolio.totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {portfolio.totalGain >= 0 ? "+" : ""}{formatCurrency(portfolio.totalGain, true)} ({formatPercent(portfolio.totalGainPercent)})
          </div>
        </div>
      </div>

      {myPositions.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">My Positions</h3>
          <div className="space-y-2">
            {myPositions.map((pos) => (
              <div key={pos.id} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-bold text-white">{pos.symbol.slice(0, 2)}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{pos.name}</div>
                    <div className="text-xs text-slate-400">{pos.quantity} shares · avg ${pos.buyPrice.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">{formatCurrency(pos.totalValue, true)}</div>
                  <div className={`text-xs font-bold ${pos.gainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {pos.gainLoss >= 0 ? "+" : ""}{formatCurrency(pos.gainLoss, true)} ({formatPercent(pos.gainLossPercent)})
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => { setSelectedAsset(markets.find((m) => m.symbol === pos.symbol)); setAction("buy"); }} className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-all border border-emerald-500/20">Buy</button>
                  <button onClick={() => { setSelectedAsset(markets.find((m) => m.symbol === pos.symbol)); setAction("sell"); }} className="px-3 py-1 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-all border border-red-500/20">Sell</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Markets</h3>
          <div className="flex items-center gap-1">
            {TYPE_FILTERS.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${activeFilter === f ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMarkets.map((asset) => {
            const hist = priceHistory[asset.symbol] ?? [];
            const owned = investments.find((inv) => inv.symbol === asset.symbol);
            return (
              <motion.div key={asset.id} whileHover={{ scale: 1.02 }}
                className="bg-slate-800/60 rounded-xl p-4 cursor-pointer hover:bg-slate-800 transition-all border border-transparent hover:border-blue-500/20"
                onClick={() => { setSelectedAsset(asset); setAction("buy"); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-white">{asset.symbol.slice(0, 2)}</div>
                    <div><div className="text-sm font-bold text-white">{asset.symbol}</div><div className="text-xs text-slate-500 capitalize">{asset.type}</div></div>
                  </div>
                  {owned && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold">Owned</span>}
                </div>

                <div className="h-16 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hist.map((p) => ({ p }))}>
                      <defs>
                        <linearGradient id={`g-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={asset.changePercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={asset.changePercent >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="p" stroke={asset.changePercent >= 0 ? "#10B981" : "#EF4444"} strokeWidth={1.5} fill={`url(#g-${asset.symbol})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 truncate max-w-32">{asset.name}</div>
                    <div className="text-base font-mono font-bold text-white">${asset.price < 100 ? asset.price.toFixed(2) : asset.price < 10000 ? asset.price.toFixed(0) : (asset.price / 1000).toFixed(1) + "K"}</div>
                  </div>
                  <div className={`text-right px-2 py-1 rounded-lg ${asset.changePercent >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    <div className="text-sm font-bold">{formatPercent(asset.changePercent)}</div>
                    <div className="text-xs">{asset.change >= 0 ? "+" : ""}{formatCurrency(Math.abs(asset.change))}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedAsset(null)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-xl font-bold text-white">{selectedAsset.symbol}</h2><p className="text-sm text-slate-400">{selectedAsset.name}</p></div>
                <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Current Price</span><span className="font-bold font-mono text-white">${selectedAsset.price.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">24h Change</span><span className={`font-bold ${selectedAsset.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatPercent(selectedAsset.changePercent)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Your Cash</span><span className="font-bold text-white">{formatCurrency(player?.money ?? 0, true)}</span></div>
              </div>

              <div className="flex mb-4 bg-slate-800 rounded-xl p-1">
                <button onClick={() => setAction("buy")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${action === "buy" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}>Buy</button>
                <button onClick={() => setAction("sell")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${action === "sell" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}>Sell</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-2">Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0.001" step="1" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-sm" />
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Total {action === "buy" ? "Cost" : "Proceeds"}</span><span className="font-bold text-white">{formatCurrency(selectedAsset.price * (parseFloat(quantity) || 0))}</span></div>
                  {action === "buy" && <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Max shares</span><span>{Math.floor((player?.money ?? 0) / selectedAsset.price)}</span></div>}
                </div>
                <div className="flex gap-2">
                  {["10%", "25%", "50%", "100%"].map((pct) => (
                    <button key={pct} onClick={() => { const maxQty = (player?.money ?? 0) / selectedAsset.price; const perc = parseInt(pct) / 100; setQuantity(Math.floor(maxQty * perc).toString()); }} className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white transition-all">{pct}</button>
                  ))}
                </div>
                <button onClick={handleTrade} disabled={isTrading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${action === "buy" ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"}`}>
                  {action === "buy" ? <ShoppingCart size={16} /> : <DollarSign size={16} />}
                  {isTrading ? "Processing..." : `${action === "buy" ? "Buy" : "Sell"} ${selectedAsset.symbol}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
