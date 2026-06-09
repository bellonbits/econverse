import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const [economy, government, events] = await Promise.all([
      prisma.economy.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.government.findFirst(),
      prisma.gameEvent.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    if (!economy) {
      // Create default if not exists
      const defaultEconomy = await prisma.economy.create({
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
      return NextResponse.json({ economy: defaultEconomy, government, events: [] });
    }

    const parsedEvents = events.map((e) => ({
      ...e,
      impacts: JSON.parse(e.impacts),
    }));

    return NextResponse.json({ economy, government, events: parsedEvents });
  } catch (error) {
    console.error("GET /api/economy:", error);
    return NextResponse.json({ error: "Failed to fetch economy" }, { status: 500 });
  }
}
