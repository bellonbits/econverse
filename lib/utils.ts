import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}K`;
    }
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function gameDayToDate(gameDay: number): string {
  const startDate = new Date(2025, 0, 1);
  startDate.setDate(startDate.getDate() + gameDay - 1);
  return startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function gameDayToYear(gameDay: number): number {
  return 2025 + Math.floor((gameDay - 1) / 365);
}

export function getColorForChange(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-zinc-400";
}

export function getBgColorForChange(value: number): string {
  if (value > 0) return "bg-emerald-400/10 text-emerald-400";
  if (value < 0) return "bg-red-400/10 text-red-400";
  return "bg-zinc-400/10 text-zinc-400";
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

export function getHealthColor(value: number): string {
  if (value >= 80) return "text-emerald-400";
  if (value >= 60) return "text-yellow-400";
  if (value >= 40) return "text-orange-400";
  return "text-red-400";
}

export function generateCitizenName(): string {
  const firstNames = ["Alex", "Jordan", "Casey", "Morgan", "Riley", "Drew", "Avery", "Quinn", "Taylor", "Sam", "Blake", "Jamie", "Skyler", "Kendall", "Peyton", "Chris", "Dana", "Reese", "Frankie", "Adrian"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Garcia", "Martinez", "Robinson", "Clark"];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

export function getEmploymentEmoji(employment: string): string {
  const emojis: Record<string, string> = {
    Student: "📚",
    "Software Engineer": "💻",
    Doctor: "⚕️",
    Teacher: "📐",
    Entrepreneur: "🚀",
    Trader: "📈",
    Designer: "🎨",
    Accountant: "📊",
    Mechanic: "🔧",
    Farmer: "🌾",
    Unemployed: "😔",
  };
  return emojis[employment] ?? "👷";
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    grocery: "emerald",
    clothing: "purple",
    electronics: "blue",
    restaurant: "orange",
    tech_startup: "cyan",
    logistics: "yellow",
    marketplace: "pink",
    manufacturing: "gray",
  };
  return colors[category] ?? "slate";
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    grocery: "🛒",
    clothing: "👗",
    electronics: "📱",
    restaurant: "🍕",
    tech_startup: "🚀",
    logistics: "🚚",
    marketplace: "🏪",
    manufacturing: "🏭",
  };
  return emojis[category] ?? "🏢";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
