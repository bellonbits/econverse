import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    const markets = await prisma.market.findMany({
      where: type ? { type } : {},
      orderBy: [{ type: "asc" }, { symbol: "asc" }],
    });
    return NextResponse.json({ markets });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}
