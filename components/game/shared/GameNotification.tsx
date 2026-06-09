"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface Props {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

const CONFIGS = {
  success: { Icon: CheckCircle2, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  error:   { Icon: XCircle,      className: "border-red-500/30 bg-red-500/10 text-red-300"             },
  warning: { Icon: AlertTriangle, className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"   },
  info:    { Icon: Info,          className: "border-blue-500/30 bg-blue-500/10 text-blue-300"          },
};

export default function GameNotification({ message, type, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  const { Icon, className } = CONFIGS[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className={`fixed bottom-20 md:bottom-6 right-3 md:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl max-w-[calc(100vw-1.5rem)] md:max-w-sm ${className}`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </motion.div>
  );
}
