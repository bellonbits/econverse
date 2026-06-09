import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) return NextResponse.json({ error: "Player ID required" }, { status: 400 });

  try {
    const [investments, markets] = await Promise.all([
      prisma.investment.findMany({ where: { playerId }, orderBy: { createdAt: "desc" } }),
      prisma.market.findMany({ orderBy: { type: "asc" } }),
    ]);
    return NextResponse.json({ investments, markets });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch investment data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, playerId, symbol, quantity } = body;

    const [player, market] = await Promise.all([
      prisma.player.findUnique({ where: { id: playerId } }),
      prisma.market.findFirst({ where: { symbol } }),
    ]);

    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    if (!market) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    if (action === "buy") {
      const totalCost = market.price * quantity;
      if (totalCost > player.money) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      // Check if player already holds this asset
      const existing = await prisma.investment.findFirst({
        where: { playerId, symbol },
      });

      if (existing) {
        // Average down/up — update existing position
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice = ((existing.buyPrice * existing.quantity) + (market.price * quantity)) / newQuantity;
        const newTotalValue = market.price * newQuantity;

        await prisma.$transaction([
          prisma.investment.update({
            where: { id: existing.id },
            data: {
              quantity: newQuantity,
              buyPrice: newAvgPrice,
              currentPrice: market.price,
              totalValue: newTotalValue,
              gainLoss: newTotalValue - (newAvgPrice * newQuantity),
              gainLossPercent: ((market.price - newAvgPrice) / newAvgPrice) * 100,
            },
          }),
          prisma.player.update({ where: { id: playerId }, data: { money: { decrement: totalCost } } }),
          prisma.transaction.create({
            data: {
              playerId, type: "investment", category: "buy",
              amount: -totalCost,
              description: `Bought ${quantity} ${symbol} @ $${market.price.toFixed(2)}`,
              balance: player.money - totalCost, gameDay: player.gameDay,
            },
          }),
        ]);
      } else {
        const investment = await prisma.investment.create({
          data: {
            playerId, type: market.type, symbol: market.symbol,
            name: market.name, quantity, buyPrice: market.price,
            currentPrice: market.price, totalValue: totalCost,
            gainLoss: 0, gainLossPercent: 0,
          },
        });

        await prisma.$transaction([
          prisma.player.update({ where: { id: playerId }, data: { money: { decrement: totalCost } } }),
          prisma.transaction.create({
            data: {
              playerId, type: "investment", category: "buy",
              amount: -totalCost,
              description: `Bought ${quantity} ${symbol} @ $${market.price.toFixed(2)}`,
              balance: player.money - totalCost, gameDay: player.gameDay,
            },
          }),
        ]);

        return NextResponse.json({ investment, message: `Bought ${quantity} shares of ${market.name}` });
      }

      return NextResponse.json({ message: `Bought ${quantity} shares of ${market.name}` });
    }

    if (action === "sell") {
      const investment = await prisma.investment.findFirst({ where: { playerId, symbol } });
      if (!investment || investment.quantity < quantity) {
        return NextResponse.json({ error: "Insufficient shares" }, { status: 400 });
      }

      const proceeds = market.price * quantity;
      const costBasis = investment.buyPrice * quantity;
      const gainLoss = proceeds - costBasis;

      if (investment.quantity === quantity) {
        await prisma.$transaction([
          prisma.investment.delete({ where: { id: investment.id } }),
          prisma.player.update({ where: { id: playerId }, data: { money: { increment: proceeds } } }),
          prisma.transaction.create({
            data: {
              playerId, type: "investment", category: "sell",
              amount: proceeds,
              description: `Sold ${quantity} ${symbol} @ $${market.price.toFixed(2)} (${gainLoss >= 0 ? "+" : ""}$${gainLoss.toFixed(2)})`,
              balance: player.money + proceeds, gameDay: player.gameDay,
            },
          }),
        ]);
      } else {
        const newQuantity = investment.quantity - quantity;
        await prisma.$transaction([
          prisma.investment.update({
            where: { id: investment.id },
            data: {
              quantity: newQuantity,
              totalValue: market.price * newQuantity,
              gainLoss: (market.price - investment.buyPrice) * newQuantity,
              gainLossPercent: ((market.price - investment.buyPrice) / investment.buyPrice) * 100,
            },
          }),
          prisma.player.update({ where: { id: playerId }, data: { money: { increment: proceeds } } }),
          prisma.transaction.create({
            data: {
              playerId, type: "investment", category: "sell",
              amount: proceeds,
              description: `Sold ${quantity} ${symbol} @ $${market.price.toFixed(2)}`,
              balance: player.money + proceeds, gameDay: player.gameDay,
            },
          }),
        ]);
      }

      return NextResponse.json({
        message: `Sold ${quantity} shares of ${market.name}`,
        gainLoss,
        gainLossPercent: (gainLoss / costBasis) * 100,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/investments:", error);
    return NextResponse.json({ error: "Investment operation failed" }, { status: 500 });
  }
}
