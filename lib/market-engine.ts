import { MarketAsset } from "@/types/game";

const INITIAL_MARKETS: Omit<MarketAsset, "id">[] = [
  // Stocks
  { symbol: "TECH", name: "TechCorp Global", type: "stock", price: 285.50, previousPrice: 280, change: 5.50, changePercent: 1.96, volume: 45000000, marketCap: 2850000000000, sector: "Technology" },
  { symbol: "BANK", name: "MetroBank", type: "stock", price: 142.30, previousPrice: 145, change: -2.70, changePercent: -1.86, volume: 12000000, marketCap: 428000000000, sector: "Finance" },
  { symbol: "HLTH", name: "HealthPlus", type: "stock", price: 420.75, previousPrice: 415, change: 5.75, changePercent: 1.38, volume: 8000000, marketCap: 620000000000, sector: "Healthcare" },
  { symbol: "GROC", name: "FreshMart Chain", type: "stock", price: 67.20, previousPrice: 68, change: -0.80, changePercent: -1.18, volume: 22000000, marketCap: 134000000000, sector: "Consumer" },
  { symbol: "ENRG", name: "PowerGrid Corp", type: "stock", price: 89.50, previousPrice: 87, change: 2.50, changePercent: 2.87, volume: 18000000, marketCap: 179000000000, sector: "Energy" },
  { symbol: "MANU", name: "Industrial Works", type: "stock", price: 156.40, previousPrice: 158, change: -1.60, changePercent: -1.01, volume: 9000000, marketCap: 312000000000, sector: "Industrial" },
  { symbol: "AUTO", name: "AutoDrive Motors", type: "stock", price: 198.20, previousPrice: 195, change: 3.20, changePercent: 1.64, volume: 15000000, marketCap: 396000000000, sector: "Automotive" },
  { symbol: "FOOD", name: "AgriGlobal", type: "stock", price: 44.80, previousPrice: 43, change: 1.80, changePercent: 4.19, volume: 30000000, marketCap: 89600000000, sector: "Agriculture" },

  // ETFs
  { symbol: "VWLD", name: "World Market ETF", type: "etf", price: 98.50, previousPrice: 97, change: 1.50, changePercent: 1.55, volume: 80000000, marketCap: 500000000000, sector: "Diversified" },
  { symbol: "VBND", name: "Bond Index ETF", type: "etf", price: 78.20, previousPrice: 78.80, change: -0.60, changePercent: -0.76, volume: 40000000, marketCap: 200000000000, sector: "Fixed Income" },
  { symbol: "REIT", name: "Real Estate ETF", type: "etf", price: 112.40, previousPrice: 110, change: 2.40, changePercent: 2.18, volume: 25000000, marketCap: 150000000000, sector: "Real Estate" },

  // Bonds
  { symbol: "GOVT10", name: "10-Year Gov Bond", type: "bond", price: 96.50, previousPrice: 97, change: -0.50, changePercent: -0.52, volume: 5000000, marketCap: 10000000000, sector: "Government" },
  { symbol: "CORP", name: "Corporate Bond Fund", type: "bond", price: 88.30, previousPrice: 87.80, change: 0.50, changePercent: 0.57, volume: 3000000, marketCap: 5000000000, sector: "Corporate" },

  // Commodities
  { symbol: "GOLD", name: "Gold Spot", type: "commodity", price: 1985.00, previousPrice: 1970, change: 15.00, changePercent: 0.76, volume: 500000, marketCap: 12000000000000, sector: "Precious Metals" },
  { symbol: "OIL", name: "Crude Oil", type: "commodity", price: 78.50, previousPrice: 80, change: -1.50, changePercent: -1.88, volume: 100000000, marketCap: 0, sector: "Energy" },
  { symbol: "BTC", name: "Bitcoin", type: "commodity", price: 42500, previousPrice: 41000, change: 1500, changePercent: 3.66, volume: 25000000000, marketCap: 830000000000, sector: "Crypto" },
];

export function getInitialMarkets(): Omit<MarketAsset, "id">[] {
  return INITIAL_MARKETS;
}

export function simulateMarketTick(
  assets: MarketAsset[],
  economyMultiplier: number,
  volatility: number = 1
): MarketAsset[] {
  return assets.map((asset) => {
    const { baseChange, vol } = getAssetCharacteristics(asset.type);

    // Random walk with drift
    const randomReturn = (Math.random() - 0.48) * vol * volatility * baseChange;
    const economyEffect = (economyMultiplier - 1) * 0.3;
    const totalReturn = randomReturn + economyEffect;

    const previousPrice = asset.price;
    const newPrice = Math.max(0.01, asset.price * (1 + totalReturn));
    const change = newPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    const volume = Math.floor(asset.volume * (0.7 + Math.random() * 0.6));

    return {
      ...asset,
      previousPrice,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
    };
  });
}

function getAssetCharacteristics(type: string): { baseChange: number; vol: number } {
  switch (type) {
    case "stock": return { baseChange: 0.15, vol: 1.2 };
    case "etf": return { baseChange: 0.08, vol: 0.7 };
    case "bond": return { baseChange: 0.03, vol: 0.3 };
    case "commodity": return { baseChange: 0.12, vol: 1.5 };
    default: return { baseChange: 0.10, vol: 1.0 };
  }
}

export function calculatePortfolioReturn(
  investments: { buyPrice: number; currentPrice: number; quantity: number }[]
): {
  totalCost: number;
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
} {
  const totalCost = investments.reduce((sum, inv) => sum + inv.buyPrice * inv.quantity, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalValue: Math.round(totalValue * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    totalGainPercent: Math.round(totalGainPercent * 100) / 100,
  };
}

export function getMentorMessageForMarket(
  action: "buy" | "sell",
  asset: MarketAsset,
  gainLossPercent?: number
): string {
  if (action === "buy") {
    if (asset.type === "stock") return `You just bought ${asset.name} stock. Stocks represent ownership in a company. When the company profits, your investment grows. This is equity investing — one of the most powerful long-term wealth builders.`;
    if (asset.type === "etf") return `ETFs (Exchange-Traded Funds) are baskets of assets. By buying ${asset.name}, you're instantly diversified — reducing risk by not putting all eggs in one basket. This is called diversification.`;
    if (asset.type === "bond") return `Bonds are loans you give to governments or corporations. They pay you interest (coupon) over time. Bonds are typically safer than stocks but offer lower returns — a classic risk-return tradeoff.`;
    if (asset.type === "commodity") return `Commodities like ${asset.name} are physical goods. They often hedge against inflation — when prices rise, commodity values tend to rise too. This is called an inflation hedge.`;
  } else {
    if (gainLossPercent !== undefined && gainLossPercent > 0) {
      return `You sold at a ${gainLossPercent.toFixed(1)}% gain — that's capital gains! Selling winners is important for realizing profits. The key insight: unrealized gains are paper wealth; realized gains are actual wealth.`;
    }
    return `You sold at a loss. In investing, sometimes strategic loss-taking makes sense — especially to offset other gains for tax purposes. This is called tax-loss harvesting.`;
  }
  return "";
}
