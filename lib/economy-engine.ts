import { Economy, GameEvent } from "@/types/game";

export interface EconomyTick {
  economy: Partial<Economy>;
  events: string[];
  priceMultiplier: number;
  wageMultiplier: number;
  demandMultiplier: number;
  investmentMultiplier: number;
}

// Simulates one tick of the economy (one game day)
export function tickEconomy(current: Economy, activeEvents: GameEvent[]): EconomyTick {
  const events: string[] = [];

  // Base random fluctuations
  const randSmall = () => (Math.random() - 0.5) * 0.1;
  const randMedium = () => (Math.random() - 0.5) * 0.5;

  // Compute event multipliers
  let inflationShock = 0;
  let unemploymentShock = 0;
  let gdpShock = 0;
  let confidenceShock = 0;

  for (const event of activeEvents) {
    for (const impact of event.impacts) {
      switch (impact.metric) {
        case "inflation": inflationShock += impact.change; break;
        case "unemployment": unemploymentShock += impact.change; break;
        case "gdp": gdpShock += impact.change; break;
        case "confidence": confidenceShock += impact.change; break;
      }
    }
  }

  // GDP growth (influenced by consumer confidence, interest rates, events)
  const baseGdpGrowth = 0.007; // 0.7% daily baseline
  const confidenceFactor = (current.consumerConfidence - 50) / 1000;
  const interestFactor = -(current.interestRate - 3) / 200;
  const newGdpGrowth = Math.max(-0.05, Math.min(0.1,
    baseGdpGrowth + confidenceFactor + interestFactor + randSmall() + gdpShock / 365
  ));
  const newGdp = current.gdp * (1 + newGdpGrowth);

  // Inflation (Phillips curve: lower unemployment = higher inflation)
  const philipsFactor = (5 - current.unemployment) * 0.02;
  const monetaryFactor = Math.max(0, current.interestRate - 2) * (-0.01);
  let newInflation = Math.max(0, Math.min(15,
    current.inflation + philipsFactor * 0.01 + monetaryFactor + randSmall() * 0.5 + inflationShock * 0.01
  ));

  // Unemployment (Okun's law: higher GDP growth = lower unemployment)
  const okunsCoeff = 0.5;
  let newUnemployment = Math.max(2, Math.min(20,
    current.unemployment - okunsCoeff * newGdpGrowth * 100 + randSmall() * 0.3 + unemploymentShock * 0.01
  ));

  // Interest rate (central bank responds to inflation)
  let newInterestRate = current.interestRate;
  if (newInflation > 3 && current.interestRate < 10) {
    newInterestRate += 0.002; // Hawkish policy
  } else if (newInflation < 1.5 && current.interestRate > 0.5) {
    newInterestRate -= 0.001; // Dovish policy
  }
  newInterestRate = Math.max(0.1, Math.min(15, newInterestRate + randSmall() * 0.01));

  // Consumer confidence (influenced by unemployment, inflation, GDP)
  const unemploymentImpact = -(newUnemployment - 5) * 0.5;
  const inflationImpact = -(newInflation - 2.5) * 0.3;
  const gdpImpact = newGdpGrowth * 100 * 0.2;
  let newConfidence = Math.max(10, Math.min(100,
    current.consumerConfidence + unemploymentImpact * 0.01 + inflationImpact * 0.01 + gdpImpact + randMedium() * 0.1 + confidenceShock * 0.01
  ));

  // Stock market (follows GDP + confidence + random walk)
  const marketGdpFactor = newGdpGrowth * 2;
  const marketConfidenceFactor = (newConfidence - 50) / 5000;
  const marketRandom = randMedium() * 0.02;
  const newStockIndex = Math.max(1000, current.stockMarketIndex * (1 + marketGdpFactor * 0.1 + marketConfidenceFactor + marketRandom));

  // Housing index (follows interest rates inversely, population growth)
  const housingInterestFactor = -(newInterestRate - 3.5) * 0.01;
  const housingPopFactor = current.populationGrowth * 0.005;
  const newHousingIndex = Math.max(50, current.housingIndex * (1 + housingInterestFactor * 0.01 + housingPopFactor * 0.01 + randSmall() * 0.005));

  // Compute derived multipliers for game systems
  const priceMultiplier = 1 + (newInflation - 2.5) / 100;
  const wageMultiplier = 1 + (newGdpGrowth * 0.5) - ((newUnemployment - 5) * 0.01);
  const demandMultiplier = newConfidence / 75;
  const investmentMultiplier = 1 + (newGdpGrowth * 2) - ((newInterestRate - 3) * 0.05);

  return {
    economy: {
      gdp: newGdp,
      gdpGrowth: newGdpGrowth * 100,
      inflation: newInflation,
      unemployment: newUnemployment,
      interestRate: newInterestRate,
      consumerConfidence: newConfidence,
      stockMarketIndex: newStockIndex,
      housingIndex: newHousingIndex,
    },
    events,
    priceMultiplier: Math.max(0.5, Math.min(2, priceMultiplier)),
    wageMultiplier: Math.max(0.5, Math.min(2, wageMultiplier)),
    demandMultiplier: Math.max(0.1, Math.min(3, demandMultiplier)),
    investmentMultiplier: Math.max(0.1, Math.min(3, investmentMultiplier)),
  };
}

export function getEconomyPhase(economy: Economy): "recession" | "recovery" | "expansion" | "peak" | "contraction" | "boom" {
  const { gdpGrowth, unemployment, consumerConfidence, inflation } = economy;

  if (gdpGrowth < -1 || unemployment > 10) return "recession";
  if (gdpGrowth < 0 && unemployment > 7) return "contraction";
  if (gdpGrowth < 2 && unemployment > 6) return "recovery";
  if (gdpGrowth > 4 && inflation > 4) return "peak";
  if (gdpGrowth > 5) return "boom";
  return "expansion";
}

export function getEconomyHealthScore(economy: Economy): number {
  let score = 100;
  // Penalize high inflation
  if (economy.inflation > 3) score -= (economy.inflation - 3) * 5;
  // Penalize high unemployment
  if (economy.unemployment > 5) score -= (economy.unemployment - 5) * 4;
  // Reward positive GDP growth
  score += economy.gdpGrowth * 2;
  // Penalize low consumer confidence
  if (economy.consumerConfidence < 50) score -= (50 - economy.consumerConfidence) * 0.5;
  return Math.max(0, Math.min(100, score));
}

export function calculateDailyExpenses(
  employment: string,
  city: string = "Metro City"
): {
  food: number;
  rent: number;
  transportation: number;
  utilities: number;
  healthcare: number;
  entertainment: number;
  total: number;
} {
  const cityMultiplier: Record<string, number> = {
    "New York": 1.5,
    "San Francisco": 1.6,
    "Metro City": 1.0,
    "Chicago": 1.1,
    "Austin": 0.9,
    "Miami": 1.2,
  };

  const multiplier = cityMultiplier[city] ?? 1.0;

  const base = {
    food: 15 * multiplier,
    rent: 40 * multiplier,
    transportation: 8 * multiplier,
    utilities: 5 * multiplier,
    healthcare: 10 * multiplier,
    entertainment: 10 * multiplier,
  };

  if (employment === "Student") {
    base.entertainment = 5 * multiplier;
    base.rent = 25 * multiplier; // Dorm/shared
  }

  const total = Object.values(base).reduce((a, b) => a + b, 0);
  return { ...base, total };
}

export function calculateTax(income: number, taxRate: number): number {
  return Math.max(0, income * (taxRate / 100));
}

export function calculateNetWorth(player: {
  money: number;
  savings: number;
  debt: number;
  investments?: { totalValue: number }[];
  properties?: { currentValue: number }[];
  businesses?: { revenue: number; expenses: number; level: number }[];
}): number {
  const cash = player.money + player.savings;
  const investmentValue = player.investments?.reduce((sum, inv) => sum + inv.totalValue, 0) ?? 0;
  const propertyValue = player.properties?.reduce((sum, prop) => sum + prop.currentValue, 0) ?? 0;
  const businessValue = player.businesses?.reduce((sum, biz) => {
    // Business valued at ~3x annual profit
    const annualProfit = (biz.revenue - biz.expenses) * 365;
    return sum + Math.max(0, annualProfit * 3 * biz.level);
  }, 0) ?? 0;

  return cash + investmentValue + propertyValue + businessValue - player.debt;
}

export const CAREER_PATHS = [
  {
    id: "software_engineer",
    title: "Software Engineer",
    category: "Technology",
    baseSalary: 95000,
    growthRate: 8,
    stressLevel: 60,
    demandLevel: 90,
    requiredEducation: "Bachelor's",
    requiredSkills: ["Programming", "Logic"],
    promotionPaths: ["Senior Engineer", "Tech Lead", "CTO"],
    description: "Build software products and systems",
  },
  {
    id: "doctor",
    title: "Doctor",
    category: "Healthcare",
    baseSalary: 200000,
    growthRate: 4,
    stressLevel: 85,
    demandLevel: 95,
    requiredEducation: "Medical Degree",
    requiredSkills: ["Medicine", "Biology"],
    promotionPaths: ["Specialist", "Chief of Medicine"],
    description: "Diagnose and treat patients",
  },
  {
    id: "teacher",
    title: "Teacher",
    category: "Education",
    baseSalary: 45000,
    growthRate: 2,
    stressLevel: 55,
    demandLevel: 70,
    requiredEducation: "Bachelor's",
    requiredSkills: ["Communication", "Patience"],
    promotionPaths: ["Head Teacher", "Principal"],
    description: "Educate and mentor students",
  },
  {
    id: "entrepreneur",
    title: "Entrepreneur",
    category: "Business",
    baseSalary: 0,
    growthRate: 20,
    stressLevel: 80,
    demandLevel: 100,
    requiredEducation: "None",
    requiredSkills: ["Business", "Risk Taking"],
    promotionPaths: ["CEO", "Investor"],
    description: "Start and grow your own business",
  },
  {
    id: "trader",
    title: "Trader",
    category: "Finance",
    baseSalary: 75000,
    growthRate: 15,
    stressLevel: 90,
    demandLevel: 65,
    requiredEducation: "Bachelor's",
    requiredSkills: ["Analytics", "Finance"],
    promotionPaths: ["Senior Trader", "Portfolio Manager"],
    description: "Trade stocks and financial instruments",
  },
  {
    id: "designer",
    title: "Designer",
    category: "Creative",
    baseSalary: 60000,
    growthRate: 5,
    stressLevel: 45,
    demandLevel: 75,
    requiredEducation: "Bachelor's",
    requiredSkills: ["Creativity", "Design Tools"],
    promotionPaths: ["Art Director", "Creative Director"],
    description: "Design products, brands, and experiences",
  },
  {
    id: "accountant",
    title: "Accountant",
    category: "Finance",
    baseSalary: 65000,
    growthRate: 4,
    stressLevel: 50,
    demandLevel: 85,
    requiredEducation: "Bachelor's",
    requiredSkills: ["Math", "Accounting"],
    promotionPaths: ["Senior Accountant", "CFO"],
    description: "Manage financial records and taxes",
  },
  {
    id: "mechanic",
    title: "Mechanic",
    category: "Trades",
    baseSalary: 50000,
    growthRate: 3,
    stressLevel: 40,
    demandLevel: 80,
    requiredEducation: "Vocational",
    requiredSkills: ["Mechanical", "Problem Solving"],
    promotionPaths: ["Master Mechanic", "Shop Owner"],
    description: "Repair and maintain vehicles and machines",
  },
];

export const BUSINESS_TEMPLATES = [
  {
    category: "grocery",
    name: "Corner Grocery",
    startCost: 15000,
    baseRevenue: 500,
    baseExpenses: 350,
    baseCustomers: 100,
    description: "Essential food retail business",
    icon: "🛒",
  },
  {
    category: "restaurant",
    name: "Food Stand",
    startCost: 8000,
    baseRevenue: 300,
    baseExpenses: 200,
    baseCustomers: 50,
    description: "Serve delicious food to hungry customers",
    icon: "🍕",
  },
  {
    category: "clothing",
    name: "Fashion Boutique",
    startCost: 20000,
    baseRevenue: 400,
    baseExpenses: 250,
    baseCustomers: 60,
    description: "Sell trendy clothing and accessories",
    icon: "👗",
  },
  {
    category: "electronics",
    name: "Tech Shop",
    startCost: 30000,
    baseRevenue: 600,
    baseExpenses: 400,
    baseCustomers: 40,
    description: "Sell electronics and gadgets",
    icon: "📱",
  },
  {
    category: "tech_startup",
    name: "Tech Startup",
    startCost: 50000,
    baseRevenue: 200,
    baseExpenses: 400,
    baseCustomers: 10,
    description: "High risk, high reward software venture",
    icon: "🚀",
  },
  {
    category: "logistics",
    name: "Delivery Service",
    startCost: 12000,
    baseRevenue: 250,
    baseExpenses: 180,
    baseCustomers: 30,
    description: "Transport goods across the city",
    icon: "🚚",
  },
];
