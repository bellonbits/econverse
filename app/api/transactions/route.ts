import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const type = searchParams.get("type");

  if (!playerId) return NextResponse.json({ error: "Player ID required" }, { status: 400 });

  try {
    const transactions = await prisma.transaction.findMany({
      where: { playerId, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
