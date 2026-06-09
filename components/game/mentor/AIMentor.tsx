"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Lightbulb, BookOpen } from "lucide-react";
import { useGameStore } from "@/store/game-store";

export default function AIMentor() {
  const { mentorMessages, dismissMentorMessage, isMentorOpen, setMentorOpen } = useGameStore();
  const latest = mentorMessages[0];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setMentorOpen(!isMentorOpen)}
        className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40 w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all"
        title="AI Economics Mentor"
      >
        <Bot size={22} className="text-white" />
        {mentorMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 text-black text-xs font-black flex items-center justify-center">
            {mentorMessages.length}
          </span>
        )}
      </button>

      {/* Floating tip */}
      <AnimatePresence>
        {latest && !isMentorOpen && (
          <motion.div
            key={latest.id}
            initial={{ opacity: 0, x: -16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="fixed bottom-32 md:bottom-20 left-4 md:left-6 z-40 max-w-xs"
          >
            <div className="glass-card rounded-2xl p-4 border border-purple-500/30 bg-purple-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-400">AI Mentor</span>
                <button onClick={() => dismissMentorMessage(latest.id)} className="ml-auto text-slate-500 hover:text-white">
                  <X size={13} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{latest.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{latest.explanation}</p>
              {latest.principle && (
                <div className="mt-2 pt-2 border-t border-purple-500/20">
                  <p className="text-xs text-purple-300 italic">"{latest.principle}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full panel */}
      <AnimatePresence>
        {isMentorOpen && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            className="fixed bottom-16 md:bottom-0 left-0 md:left-16 top-auto md:top-14 h-[70vh] md:h-auto z-40 w-full md:w-80 bg-slate-900/95 border-t md:border-r border-purple-500/20 flex flex-col backdrop-blur-xl rounded-t-3xl md:rounded-none"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-purple-500/20 bg-purple-900/20">
              <Bot size={18} className="text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Economics Mentor</h3>
                <p className="text-xs text-slate-400">Learning from your decisions</p>
              </div>
              <button onClick={() => setMentorOpen(false)} className="ml-auto text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mentorMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Make decisions and I'll explain the economics behind them.</p>
                </div>
              ) : (
                mentorMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-purple-300">{msg.title}</h4>
                      <button onClick={() => dismissMentorMessage(msg.id)} className="text-slate-500 hover:text-white flex-shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{msg.explanation}</p>
                    {msg.principle && (
                      <div className="bg-purple-900/30 rounded-lg p-2.5 border border-purple-500/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightbulb size={11} className="text-purple-400" />
                          <span className="text-xs font-medium text-purple-400">Key Principle</span>
                        </div>
                        <p className="text-xs text-slate-300 italic">"{msg.principle}"</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-purple-500/20 bg-purple-900/10">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-slate-500" />
                <p className="text-xs text-slate-500 font-medium">Core Concepts</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Supply & Demand", "Inflation", "Compound Interest", "Risk/Return", "Diversification", "Opportunity Cost"].map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/20 text-purple-400 text-xs">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
