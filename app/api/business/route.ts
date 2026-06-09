import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { BUSINESS_TEMPLATES } from "@/lib/economy-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "Player ID required" }, { status: 400 });
  }

  try {
    const businesses = await prisma.business.findMany({
      where: { playerId },
      include: { employees: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ businesses });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, category, name } = body;

    if (!playerId || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const template = BUSINESS_TEMPLATES.find((t) => t.category === category);
    if (!template) {
      return NextResponse.json({ error: "Invalid business category" }, { status: 400 });
    }

    if (player.money < template.startCost) {
      return NextResponse.json(
        { error: `Insufficient funds. Need $${template.startCost.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Deduct startup cost
    const newMoney = player.money - template.startCost;

    const [business] = await prisma.$transaction([
      prisma.business.create({
        data: {
          playerId,
          name: name || template.name,
          category,
          revenue: template.baseRevenue,
          expenses: template.baseExpenses,
          profit: template.baseRevenue - template.baseExpenses,
          cashFlow: template.baseRevenue - template.baseExpenses,
          customers: template.baseCustomers,
          inventory: 1000,
          level: 1,
          isActive: true,
          price: 10,
          demand: 50,
          startCost: template.startCost,
        },
      }),
      prisma.player.update({
        where: { id: playerId },
        data: {
          money: newMoney,
          netWorth: player.netWorth - template.startCost, // Will be recalculated
        },
      }),
      prisma.transaction.create({
        data: {
          playerId,
          type: "expense",
          category: "business_startup",
          amount: -template.startCost,
          description: `Started ${name || template.name} — ${category} business`,
          balance: newMoney,
          gameDay: player.gameDay,
        },
      }),
    ]);

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error("POST /api/business:", error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}
