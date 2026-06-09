import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_MARKETS = [
  { symbol: "TECH", name: "TechCorp Global", type: "stock", price: 285.50, previousPrice: 280, change: 5.50, changePercent: 1.96, volume: 45000000, marketCap: 2850000000000, sector: "Technology" },
  { symbol: "BANK", name: "MetroBank", type: "stock", price: 142.30, previousPrice: 145, change: -2.70, changePercent: -1.86, volume: 12000000, marketCap: 428000000000, sector: "Finance" },
  { symbol: "HLTH", name: "HealthPlus", type: "stock", price: 420.75, previousPrice: 415, change: 5.75, changePercent: 1.38, volume: 8000000, marketCap: 620000000000, sector: "Healthcare" },
  { symbol: "GROC", name: "FreshMart Chain", type: "stock", price: 67.20, previousPrice: 68, change: -0.80, changePercent: -1.18, volume: 22000000, marketCap: 134000000000, sector: "Consumer" },
  { symbol: "ENRG", name: "PowerGrid Corp", type: "stock", price: 89.50, previousPrice: 87, change: 2.50, changePercent: 2.87, volume: 18000000, marketCap: 179000000000, sector: "Energy" },
  { symbol: "MANU", name: "Industrial Works", type: "stock", price: 156.40, previousPrice: 158, change: -1.60, changePercent: -1.01, volume: 9000000, marketCap: 312000000000, sector: "Industrial" },
  { symbol: "AUTO", name: "AutoDrive Motors", type: "stock", price: 198.20, previousPrice: 195, change: 3.20, changePercent: 1.64, volume: 15000000, marketCap: 396000000000, sector: "Automotive" },
  { symbol: "FOOD", name: "AgriGlobal", type: "stock", price: 44.80, previousPrice: 43, change: 1.80, changePercent: 4.19, volume: 30000000, marketCap: 89600000000, sector: "Agriculture" },
  { symbol: "VWLD", name: "World Market ETF", type: "etf", price: 98.50, previousPrice: 97, change: 1.50, changePercent: 1.55, volume: 80000000, marketCap: 500000000000, sector: "Diversified" },
  { symbol: "VBND", name: "Bond Index ETF", type: "etf", price: 78.20, previousPrice: 78.80, change: -0.60, changePercent: -0.76, volume: 40000000, marketCap: 200000000000, sector: "Fixed Income" },
  { symbol: "REIT", name: "Real Estate ETF", type: "etf", price: 112.40, previousPrice: 110, change: 2.40, changePercent: 2.18, volume: 25000000, marketCap: 150000000000, sector: "Real Estate" },
  { symbol: "GOVT10", name: "10-Year Gov Bond", type: "bond", price: 96.50, previousPrice: 97, change: -0.50, changePercent: -0.52, volume: 5000000, marketCap: 10000000000, sector: "Government" },
  { symbol: "CORP", name: "Corporate Bond Fund", type: "bond", price: 88.30, previousPrice: 87.80, change: 0.50, changePercent: 0.57, volume: 3000000, marketCap: 5000000000, sector: "Corporate" },
  { symbol: "GOLD", name: "Gold Spot", type: "commodity", price: 1985.00, previousPrice: 1970, change: 15.00, changePercent: 0.76, volume: 500000, marketCap: 12000000000000, sector: "Precious Metals" },
  { symbol: "OIL", name: "Crude Oil", type: "commodity", price: 78.50, previousPrice: 80, change: -1.50, changePercent: -1.88, volume: 100000000, marketCap: 0, sector: "Energy" },
  { symbol: "BTC", name: "Bitcoin", type: "commodity", price: 42500, previousPrice: 41000, change: 1500, changePercent: 3.66, volume: 25000000000, marketCap: 830000000000, sector: "Crypto" },
];

async function main() {
  console.log("🌱 Seeding EconoVerse database...");

  await prisma.economy.deleteMany();
  await prisma.economy.create({
    data: {
      gdp: 25_000_000_000_000,
      gdpGrowth: 2.5,
      inflation: 2.8,
      unemployment: 4.2,
      interestRate: 5.25,
      populationGrowth: 1.1,
      consumerConfidence: 72,
      stockMarketIndex: 45000,
      housingIndex: 285,
      taxRevenue: 4_500_000_000_000,
      governmentSpending: 6_500_000_000_000,
      tradeBalance: -800_000_000_000,
      gameDay: 1,
    },
  });

  await prisma.government.deleteMany();
  await prisma.government.create({
    data: {
      incomeTaxRate: 22,
      businessTaxRate: 21,
      salesTaxRate: 8.5,
      propertyTaxRate: 1.2,
      totalRevenue: 4_500_000_000_000,
      totalSpending: 6_500_000_000_000,
      deficit: 2_000_000_000_000,
      infrastructureScore: 68,
    },
  });

  await prisma.market.deleteMany();
  for (const market of INITIAL_MARKETS) {
    await prisma.market.create({
      data: { ...market, updatedAt: new Date() },
    });
  }

  await prisma.citizen.deleteMany();
  const employmentTypes = ["Employed", "Student", "Self-Employed", "Unemployed"];
  for (let i = 0; i < 50; i++) {
    await prisma.citizen.create({
      data: {
        name: `Citizen ${i + 1}`,
        age: 20 + Math.floor(Math.random() * 50),
        income: 30000 + Math.random() * 120000,
        expenses: 20000 + Math.random() * 60000,
        savings: Math.random() * 50000,
        employment: employmentTypes[Math.floor(Math.random() * 4)],
        happiness: 40 + Math.random() * 60,
        posX: (Math.random() - 0.5) * 40,
        posZ: (Math.random() - 0.5) * 40,
      },
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
