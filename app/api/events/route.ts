import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");

  try {
    const events = await prisma.gameEvent.findMany({
      where: active === "true" ? { isActive: true } : {},
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const parsed = events.map((e) => ({
      ...e,
      impacts: JSON.parse(e.impacts),
    }));

    return NextResponse.json({ events: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
