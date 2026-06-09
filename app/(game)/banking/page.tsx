"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useGameStore } from "@/store/game-store";
import { formatCurrency } from "@/lib/utils";
import { getEconomicPrinciple } from "@/lib/event-engine";
import {
  DollarSign, Landmark, CreditCard, Star, Lightbulb,
  ClipboardList, Calculator,
} from "lucide-react";

const LOAN_TYPES = [
  { type: "personal",  label: "Personal Loan",  rate: 12.5, maxAmount: 50000,   term: 36,  desc: "Quick cash for personal needs" },
  { type: "mortgage",  label: "Home Mortgage",  rate: 6.8,  maxAmount: 500000,  term: 360, desc: "Finance real estate purchases" },
  { type: "business",  label: "Business Loan",  rate: 9.5,  maxAmount: 250000,  term: 60,  desc: "Fund business operations" },
  { type: "student",   label: "Student Loan",   rate: 5.5,  maxAmount: 100000,  term: 120, desc: "Invest in your education" },
];

const ACCOUNT_TYPES = [
  { type: "checking",     label: "Checking Account", rate: 0.5,  minBalance: 0,    desc: "For daily transactions",          Icon: CreditCard },
  { type: "savings",      label: "Savings Account",  rate: 4.5,  minBalance: 100,  desc: "Earn interest on deposits",       Icon: Landmark   },
  { type: "money_market", label: "Money Market",      rate: 5.2,  minBalance: 1000, desc: "High-yield for large balances",   Icon: DollarSign },
];

export default function BankingPage() {
  const { player, setPlayer, bankAccounts, setBankAccounts, loans, setLoans, addMentorMessage, showNotification, economy } = useGameStore();
  const [activeTab, setActiveTab] = useState<"accounts" | "loans" | "calculator">("accounts");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [loanType, setLoanType] = useState("personal");
  const [loanAmount, setLoanAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalSavings = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = loans.reduce((sum, l) => sum + l.remaining, 0);
  const creditScore = Math.min(850, Math.max(300, 650 + (player?.reputation ?? 50) * 2));

  const handleDeposit = async () => {
    if (!player || !selectedAccount) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0 || amount > player.money) { showNotification("Invalid deposit amount", "error"); return; }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deposit", playerId: player.id, accountId: selectedAccount, amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPlayer({ ...player, money: player.money - amount, savings: player.savings + amount });
      setBankAccounts(bankAccounts.map((a) => a.id === selectedAccount ? { ...a, balance: a.balance + amount } : a));

      const principle = getEconomicPrinciple("save_money");
      addMentorMessage({ id: Date.now().toString(), trigger: "save_money", title: principle.title, explanation: principle.explanation, principle: principle.principle, example: `You deposited ${formatCurrency(amount)} earning interest over time.`, timestamp: Date.now() });

      showNotification(data.message, "success");
      setDepositAmount("");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakeLoan = async () => {
    if (!player) return;
    const amount = parseFloat(loanAmount);
    const lt = LOAN_TYPES.find((l) => l.type === loanType);
    if (!lt || isNaN(amount) || amount <= 0 || amount > lt.maxAmount) { showNotification("Invalid loan amount", "error"); return; }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "take_loan", playerId: player.id, type: loanType, amount, termMonths: lt.term }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPlayer({ ...player, money: player.money + amount, debt: player.debt + amount });
      setLoans([...loans, data.loan]);

      const principle = getEconomicPrinciple("take_loan");
      addMentorMessage({ id: Date.now().toString(), trigger: "take_loan", title: principle.title, explanation: principle.explanation, principle: principle.principle, example: `You borrowed ${formatCurrency(amount)} at ${lt.rate}% APR. Monthly payment: ${formatCurrency(data.loan.monthlyPayment)}.`, timestamp: Date.now() });

      showNotification(`${lt.label} approved! ${formatCurrency(amount)} added to your account.`, "success");
      setLoanAmount("");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openAccount = async (type: string) => {
    if (!player) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open_account", playerId: player.id, type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBankAccounts([...bankAccounts, data.account]);
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} account opened!`, "success");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedLoan = LOAN_TYPES.find((l) => l.type === loanType);
  const loanAmountNum = parseFloat(loanAmount) || 0;
  const monthlyRate = (selectedLoan?.rate ?? 10) / 100 / 12;
  const termMonths = selectedLoan?.term ?? 36;
  const monthlyPayment = loanAmountNum > 0 ? (loanAmountNum * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths)) : 0;
  const totalInterest = (monthlyPayment * termMonths) - loanAmountNum;

  const SUMMARY_CARDS = [
    { label: "Cash on Hand",  value: formatCurrency(player?.money ?? 0, true), Icon: DollarSign, color: "text-emerald-400" },
    { label: "Total Savings", value: formatCurrency(totalSavings, true),        Icon: Landmark,   color: "text-blue-400" },
    { label: "Total Debt",    value: formatCurrency(totalDebt, true),           Icon: CreditCard, color: "text-red-400" },
    { label: "Credit Score",  value: creditScore.toFixed(0), Icon: Star, color: creditScore >= 750 ? "text-emerald-400" : creditScore >= 650 ? "text-yellow-400" : "text-red-400" },
  ];

  const TABS = [
    { id: "accounts",   label: "Accounts",   Icon: CreditCard },
    { id: "loans",      label: "Loans",      Icon: ClipboardList },
    { id: "calculator", label: "Calculator", Icon: Calculator },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Landmark size={22} className="text-blue-400" /> Banking Center</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage accounts, loans, and credit</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><s.Icon size={14} className={s.color} /><span className="text-xs text-slate-400">{s.label}</span></div>
            <div className={`text-xl font-black font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
            <tab.Icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "accounts" && (
        <div className="space-y-4">
          {bankAccounts.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Your Accounts</h3>
              <div className="space-y-3">
                {bankAccounts.map((acct) => {
                  const acctMeta = ACCOUNT_TYPES.find((a) => a.type === acct.type);
                  const AcctIcon = acctMeta?.Icon ?? Landmark;
                  return (
                    <div key={acct.id} className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center"><AcctIcon size={18} className="text-blue-400" /></div>
                        <div>
                          <div className="font-semibold text-white capitalize">{acct.type.replace("_", " ")} Account</div>
                          <div className="text-xs text-slate-400">{(acct.interestRate * 100).toFixed(2)}% APY</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-lg">{formatCurrency(acct.balance, true)}</div>
                        <div className="text-xs text-emerald-400">+{formatCurrency((acct.balance * acct.interestRate) / 12, true)}/mo interest</div>
                      </div>
                      {acct.type === "savings" && (
                        <div className="flex gap-2 ml-4">
                          <input type="number" placeholder="Amount" value={selectedAccount === acct.id ? depositAmount : ""} onChange={(e) => { setDepositAmount(e.target.value); setSelectedAccount(acct.id); }} className="w-24 px-2 py-1 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs focus:outline-none focus:border-blue-500" />
                          <button onClick={() => { setSelectedAccount(acct.id); handleDeposit(); }} disabled={isProcessing} className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">Deposit</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Open New Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ACCOUNT_TYPES.filter((at) => !bankAccounts.find((a) => a.type === at.type)).map((at) => (
                <div key={at.type} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/40 hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <at.Icon size={20} className="text-blue-400" />
                    <div><div className="text-sm font-bold text-white">{at.label}</div><div className="text-xs text-emerald-400">{at.rate}% APY</div></div>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{at.desc}</div>
                  {at.minBalance > 0 && <div className="text-xs text-slate-500 mb-3">Min balance: {formatCurrency(at.minBalance)}</div>}
                  <button onClick={() => openAccount(at.type)} disabled={isProcessing} className="w-full py-2 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/20 hover:bg-blue-600/30 transition-all">Open Account</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "loans" && (
        <div className="space-y-4">
          {loans.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Active Loans</h3>
              <div className="space-y-3">
                {loans.map((loan) => {
                  const paidPct = (loan.paidMonths / loan.termMonths) * 100;
                  return (
                    <div key={loan.id} className="p-4 bg-slate-800/60 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div><div className="font-semibold text-white capitalize">{loan.type} Loan</div><div className="text-xs text-slate-400">{loan.interestRate}% APR · {loan.termMonths} months</div></div>
                        <div className="text-right"><div className="font-bold text-red-400">{formatCurrency(loan.remaining, true)} remaining</div><div className="text-xs text-slate-400">{formatCurrency(loan.monthlyPayment)}/mo</div></div>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${paidPct}%` }} /></div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1"><span>{loan.paidMonths} months paid</span><span>{loan.termMonths - loan.paidMonths} months remaining</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Apply for a Loan</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {LOAN_TYPES.map((lt) => (
                <button key={lt.type} onClick={() => setLoanType(lt.type)}
                  className={`p-4 rounded-xl border text-left transition-all ${loanType === lt.type ? "border-blue-500 bg-blue-500/15" : "border-slate-700/60 bg-slate-800/50 hover:border-slate-600"}`}>
                  <div className="font-semibold text-white text-sm mb-1">{lt.label}</div>
                  <div className="text-xs text-slate-400 mb-2">{lt.desc}</div>
                  <div className="flex gap-3 text-xs">
                    <div><div className="text-slate-500">Rate</div><div className="font-bold text-red-400">{lt.rate}% APR</div></div>
                    <div><div className="text-slate-500">Max</div><div className="font-bold text-white">{formatCurrency(lt.maxAmount, true)}</div></div>
                    <div><div className="text-slate-500">Term</div><div className="font-bold text-white">{lt.term}mo</div></div>
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Loan Amount</label>
                <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder={`Max ${formatCurrency(selectedLoan?.maxAmount ?? 0)}`} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              {loanAmountNum > 0 && (
                <div className="bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Monthly Payment</span><span className="font-bold text-white">{formatCurrency(monthlyPayment)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Total Interest</span><span className="font-bold text-red-400">{formatCurrency(totalInterest, true)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Total Cost</span><span className="font-bold text-white">{formatCurrency(loanAmountNum + totalInterest, true)}</span></div>
                </div>
              )}
              <button onClick={handleTakeLoan} disabled={isProcessing || loanAmountNum <= 0} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50">
                {isProcessing ? "Processing..." : "Apply for Loan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "calculator" && <CompoundCalculator economy={economy} />}
    </div>
  );
}

function CompoundCalculator({ economy }: { economy: any }) {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("10");
  const [monthly, setMonthly] = useState("0");

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) / 100;
  const n = 12;
  const t = parseFloat(years) || 0;
  const m = parseFloat(monthly) || 0;
  const futureValue = p * Math.pow(1 + r / n, n * t) + m * (Math.pow(1 + r / n, n * t) - 1) / (r / n);
  const totalContributions = p + m * 12 * t;
  const totalInterestEarned = futureValue - totalContributions;

  const chartData = Array.from({ length: Math.ceil(t) }, (_, i) => ({
    year: i + 1,
    value: Math.round(p * Math.pow(1 + r / n, n * (i + 1)) + m * (Math.pow(1 + r / n, n * (i + 1)) - 1) / (r / n)),
    contributions: Math.round(p + m * 12 * (i + 1)),
  }));

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Lightbulb size={14} className="text-yellow-400" /> Compound Interest Calculator</h3>
        <p className="text-xs text-slate-400">See the power of compound growth over time</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Initial Investment", value: principal, onChange: setPrincipal, prefix: "KSh" },
          { label: "Annual Return (%)", value: rate, onChange: setRate, suffix: "%" },
          { label: "Time Period (years)", value: years, onChange: setYears, suffix: "yrs" },
          { label: "Monthly Contribution", value: monthly, onChange: setMonthly, prefix: "KSh" },
        ].map((f) => (
          <div key={f.label}>
            <label className="text-xs text-slate-400 block mb-1.5">{f.label}</label>
            <div className="relative">
              {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{f.prefix}</span>}
              <input type="number" value={f.value} onChange={(e) => f.onChange(e.target.value)} className={`w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 ${f.prefix ? "pl-7 pr-3" : f.suffix ? "pl-3 pr-8" : "px-3"}`} />
              {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{f.suffix}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3"><div className="text-xs text-slate-400">Final Value</div><div className="text-lg font-black text-emerald-400">{formatCurrency(futureValue, true)}</div></div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3"><div className="text-xs text-slate-400">Contributions</div><div className="text-lg font-black text-blue-400">{formatCurrency(totalContributions, true)}</div></div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3"><div className="text-xs text-slate-400">Interest Earned</div><div className="text-lg font-black text-purple-400">{formatCurrency(totalInterestEarned, true)}</div></div>
      </div>
      {chartData.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Growth over time</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="compoundGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="year" tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v: number) => `Y${v}`} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "12px" }} formatter={(v: number, name: string) => [formatCurrency(v, true), name === "value" ? "Total Value" : "Contributions"]} />
                <Area type="monotone" dataKey="contributions" stroke="#3B82F6" strokeWidth={1.5} fill="url(#contribGrad)" />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#compoundGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
        <div className="flex items-start gap-2"><Lightbulb size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" /><p className="text-xs text-yellow-300"><strong>Rule of 72:</strong> Divide 72 by your return rate to find doubling time. At {rate}% return, your money doubles every <strong>{(72 / parseFloat(rate || "1")).toFixed(1)} years</strong>.</p></div>
      </div>
    </div>
  );
}
