import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateNetWorth } from "@/lib/economy-engine";

export async function GET() {
  try {
    const player = await prisma.player.findFirst({
      include: {
        skills: true,
        bankAccounts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!player) {
      return NextResponse.json({ player: null });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error("GET /api/player:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, country, education } = body;

    if (!name || !age || !country || !education) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Delete existing player and all related records (single-player game)
    // Must delete in dependency order: children before parents
    const existing = await prisma.player.findFirst();
    if (existing) {
      const businesses = await prisma.business.findMany({ where: { playerId: existing.id }, select: { id: true } });
      await prisma.employee.deleteMany({ where: { businessId: { in: businesses.map((b) => b.id) } } });
      await prisma.business.deleteMany({ where: { playerId: existing.id } });
      await prisma.property.deleteMany({ where: { playerId: existing.id } });
      await prisma.investment.deleteMany({ where: { playerId: existing.id } });
      await prisma.loan.deleteMany({ where: { playerId: existing.id } });
      await prisma.transaction.deleteMany({ where: { playerId: existing.id } });
      await prisma.bankAccount.deleteMany({ where: { playerId: existing.id } });
      await prisma.playerSkill.deleteMany({ where: { playerId: existing.id } });
      await prisma.player.delete({ where: { id: existing.id } });
    }

    const player = await prisma.player.create({
      data: {
        name,
        age: parseInt(age),
        country,
        education,
        money: 1000,
        savings: 0,
        debt: 0,
        happiness: 80,
        health: 100,
        educationLevel: 1,
        reputation: 50,
        netWorth: 1000,
        employment: "Student",
        salary: 0,
        gameDay: 1,
      },
    });

    // Create default checking account
    await prisma.bankAccount.create({
      data: {
        playerId: player.id,
        type: "checking",
        balance: 1000,
        interestRate: 0.01,
      },
    });

    // Add initial transaction
    await prisma.transaction.create({
      data: {
        playerId: player.id,
        type: "income",
        category: "starting_bonus",
        amount: 1000,
        description: "Starting funds — your economic journey begins!",
        balance: 1000,
        gameDay: 1,
      },
    });

    // Add initial skills
    const initialSkills = [
      { name: "Financial Literacy", level: 1, category: "finance" },
      { name: "Communication", level: 1, category: "social" },
    ];

    for (const skill of initialSkills) {
      await prisma.playerSkill.create({
        data: { playerId: player.id, ...skill },
      });
    }

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error("POST /api/player:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, ...updates } = body;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: updates,
    });

    return NextResponse.json({ player: updatedPlayer });
  } catch (error) {
    console.error("PATCH /api/player:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}
