"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, TrendingUp, Building2, Landmark, Bot, BarChart3,
  DollarSign, Smile, Heart, Star, ChevronRight, ArrowRight,
} from "lucide-react";
import { useGameStore } from "@/store/game-store";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Japan", "Singapore", "India", "Brazil", "South Africa", "Kenya",
];

const EDUCATION_LEVELS = [
  { value: "High School",  label: "High School",      description: "General education" },
  { value: "Vocational",   label: "Trade School",      description: "Specialized skills" },
  { value: "Associate",    label: "Associate Degree",  description: "2-year college" },
  { value: "Bachelor's",   label: "Bachelor's Degree", description: "4-year university" },
  { value: "Master's",     label: "Master's Degree",   description: "Graduate level" },
  { value: "PhD",          label: "PhD / Doctorate",   description: "Highest academic" },
];

const STARTING_STATS = [
  { label: "Starting Cash", value: "$1,000",   Icon: DollarSign, color: "from-emerald-500 to-teal-600"  },
  { label: "Happiness",     value: "80/100",   Icon: Smile,      color: "from-yellow-500 to-orange-500" },
  { label: "Health",        value: "100/100",  Icon: Heart,      color: "from-red-500 to-pink-600"      },
  { label: "Reputation",    value: "50/100",   Icon: Star,       color: "from-purple-500 to-violet-600" },
];

const FEATURES = [
  { Icon: Building2,   title: "Living 3D City",    desc: "Watch your economy breathe life into a real city"  },
  { Icon: TrendingUp,  title: "Real Markets",       desc: "Trade stocks, ETFs, bonds and commodities"        },
  { Icon: Building2,   title: "Run Businesses",     desc: "Start, manage and scale your own empire"          },
  { Icon: Landmark,    title: "Banking System",     desc: "Loans, savings, credit scores and mortgages"      },
  { Icon: Bot,         title: "AI Mentor",          desc: "Learn economics principles as you play"           },
  { Icon: Globe,       title: "Global Economy",     desc: "Inflation, recessions, booms — all simulated"     },
];

const LOADING_MESSAGES = [
  "Creating your character profile...",
  "Generating world economy...",
  "Populating market data...",
  "Building your city...",
  "Seeding citizens...",
  "Calculating starting conditions...",
  "Your world is ready!",
];

export default function LandingPage() {
  const router = useRouter();
  const { setPlayer } = useGameStore();
  const [step, setStep] = useState<"hero" | "create" | "loading">("hero");
  const [form, setForm] = useState({ name: "", age: "22", country: "United States", education: "High School" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x = ((p.x + p.vx + canvas.width) % canvas.width);
        p.y = ((p.y + p.vy + canvas.height) % canvas.height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.opacity})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "Name must be at least 2 characters";
    const age = parseInt(form.age);
    if (isNaN(age) || age < 16 || age > 80) e.age = "Age must be between 16 and 80";
    if (!form.country) e.country = "Select a country";
    if (!form.education) e.education = "Select education level";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setStep("loading");

    for (let i = 0; i < LOADING_MESSAGES.length; i++) {
      setLoadingMsg(LOADING_MESSAGES[i]);
      await new Promise((r) => setTimeout(r, 580));
    }

    try {
      const res = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const { player } = await res.json();
      setPlayer(player);
      router.push("/dashboard");
    } catch {
      setStep("create");
      setIsSubmitting(false);
      setErrors({ submit: "Failed to create your profile. Please try again." });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060B14]">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg,rgba(59,130,246,1) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">

        {/* HERO */}
        {step === "hero" && (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
            className="relative z-10 min-h-screen flex flex-col">
            <nav className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-black text-white text-sm">E</div>
                <span className="text-base md:text-lg font-bold tracking-tight text-white">EconoVerse</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Economy Simulated in Real-Time
              </div>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4 md:mb-5">
                <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs md:text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  The Economics Simulation Game
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-4 md:mb-6">
                <span className="text-white">Econo</span>
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Verse</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                className="text-lg md:text-2xl text-slate-300 max-w-xl mb-2 md:mb-3 leading-relaxed font-medium px-2">
                Build wealth. Run businesses. Master markets.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
                className="text-sm md:text-base text-slate-500 max-w-lg mb-8 md:mb-12 px-4">
                An immersive simulation where you accidentally become financially literate — through play.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.42 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setStep("create")}
                className="flex items-center justify-center gap-2 w-full max-w-xs md:w-auto px-8 md:px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base md:text-lg shadow-[0_0_40px_rgba(59,130,246,0.35)] hover:shadow-[0_0_60px_rgba(59,130,246,0.55)] transition-all duration-300"
              >
                Start Your Economic Journey
                <ArrowRight size={18} />
              </motion.button>

              {/* Starting stats */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="mt-8 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full max-w-sm md:max-w-xl">
                {STARTING_STATS.map((s) => (
                  <div key={s.label} className="glass-card rounded-2xl p-3 md:p-4 text-center">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-1.5 md:mb-2`}>
                      <s.Icon size={14} className="text-white" />
                    </div>
                    <div className={`text-sm md:text-base font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Features */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="px-4 md:px-8 pb-8 md:pb-14">
              <div className="max-w-5xl mx-auto grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                {FEATURES.map(({ Icon, title, desc }) => (
                  <div key={title} className="glass rounded-xl md:rounded-2xl p-3 md:p-4 text-center hover:border-blue-500/30 transition-all">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-500/15 flex items-center justify-center mx-auto mb-1.5 md:mb-2">
                      <Icon size={16} className="text-blue-400" />
                    </div>
                    <div className="text-xs font-semibold text-white mb-0.5 md:mb-1">{title}</div>
                    <div className="text-xs text-slate-500 hidden md:block">{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* CREATE CHARACTER */}
        {step === "create" && (
          <motion.div key="create" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="relative z-10 min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-lg">
              <button onClick={() => setStep("hero")}
                className="mb-6 text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors">
                <ChevronRight size={14} className="rotate-180" /> Back
              </button>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="glass-card rounded-3xl p-8">
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={28} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Create Your Character</h2>
                  <p className="text-slate-400 text-sm mt-1.5">Your story begins with $1,000 and a dream.</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input
                      type="text" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                    <input
                      type="number" value={form.age} min={16} max={80}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-white focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                    />
                    {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                    <select
                      value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-white focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none text-sm"
                    >
                      {COUNTRIES.map((c) => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                    </select>
                    {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Education Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EDUCATION_LEVELS.map((e) => (
                        <button key={e.value} onClick={() => setForm({ ...form, education: e.value })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            form.education === e.value
                              ? "border-blue-500 bg-blue-500/15 text-white"
                              : "border-slate-700/60 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                          }`}>
                          <div className="text-xs font-semibold">{e.label}</div>
                          <div className="text-xs opacity-60 mt-0.5">{e.description}</div>
                        </button>
                      ))}
                    </div>
                    {errors.education && <p className="text-red-400 text-xs mt-1">{errors.education}</p>}
                  </div>

                  {errors.submit && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{errors.submit}</div>
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleStart} disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-base shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Begin Your Journey <ArrowRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-8"
              >
                <Globe size={38} className="text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">Building Your World</h2>
              <motion.p key={loadingMsg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="text-slate-400 text-sm">
                {loadingMsg}
              </motion.p>
              <div className="mt-8 w-64 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: 4.1, ease: "easeInOut" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
