import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) return NextResponse.json({ error: "Player ID required" }, { status: 400 });

  try {
    const [accounts, loans] = await Promise.all([
      prisma.bankAccount.findMany({ where: { playerId }, orderBy: { createdAt: "asc" } }),
      prisma.loan.findMany({ where: { playerId, isPaid: false }, orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({ accounts, loans });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch banking data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, playerId, ...data } = body;

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    if (action === "deposit") {
      const { accountId, amount } = data;
      if (amount <= 0 || amount > player.money) {
        return NextResponse.json({ error: "Invalid deposit amount" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.bankAccount.update({ where: { id: accountId }, data: { balance: { increment: amount } } }),
        prisma.player.update({ where: { id: playerId }, data: { money: { decrement: amount }, savings: { increment: amount } } }),
        prisma.transaction.create({
          data: {
            playerId, type: "transfer", category: "bank_deposit",
            amount: -amount, description: `Deposited to savings account`,
            balance: player.money - amount, gameDay: player.gameDay,
          },
        }),
      ]);

      return NextResponse.json({ success: true, message: `Deposited $${amount.toFixed(2)}` });
    }

    if (action === "withdraw") {
      const { accountId, amount } = data;
      const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
      if (!account || amount <= 0 || amount > account.balance) {
        return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.bankAccount.update({ where: { id: accountId }, data: { balance: { decrement: amount } } }),
        prisma.player.update({ where: { id: playerId }, data: { money: { increment: amount }, savings: { decrement: amount } } }),
        prisma.transaction.create({
          data: {
            playerId, type: "transfer", category: "bank_withdrawal",
            amount, description: `Withdrew from savings account`,
            balance: player.money + amount, gameDay: player.gameDay,
          },
        }),
      ]);

      return NextResponse.json({ success: true, message: `Withdrew $${amount.toFixed(2)}` });
    }

    if (action === "open_account") {
      const { type, initialDeposit = 0 } = data;
      const interestRates: Record<string, number> = {
        checking: 0.005, savings: 0.045, money_market: 0.052,
      };

      if (initialDeposit > 0 && initialDeposit > player.money) {
        return NextResponse.json({ error: "Insufficient funds for initial deposit" }, { status: 400 });
      }

      const account = await prisma.bankAccount.create({
        data: {
          playerId, type,
          balance: initialDeposit,
          interestRate: interestRates[type] ?? 0.01,
        },
      });

      if (initialDeposit > 0) {
        await prisma.player.update({
          where: { id: playerId },
          data: { money: { decrement: initialDeposit }, savings: { increment: initialDeposit } },
        });
      }

      return NextResponse.json({ account }, { status: 201 });
    }

    if (action === "take_loan") {
      const { type, amount, termMonths } = data;
      const interestRates: Record<string, number> = {
        personal: 12.5, mortgage: 6.8, business: 9.5, student: 5.5,
      };

      const rate = interestRates[type] ?? 10;
      const monthlyRate = rate / 100 / 12;
      const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

      const creditScore = 650 + (player.reputation * 2); // Simple credit score
      if (creditScore < 580 && amount > 10000) {
        return NextResponse.json({ error: "Credit score too low for this loan amount" }, { status: 400 });
      }

      const [loan] = await prisma.$transaction([
        prisma.loan.create({
          data: {
            playerId, type, amount, remaining: amount,
            interestRate: rate, monthlyPayment, termMonths, paidMonths: 0,
          },
        }),
        prisma.player.update({
          where: { id: playerId },
          data: { money: { increment: amount }, debt: { increment: amount } },
        }),
        prisma.transaction.create({
          data: {
            playerId, type: "loan", category: "loan_received",
            amount, description: `${type} loan approved — $${amount.toLocaleString()} at ${rate}% APR`,
            balance: player.money + amount, gameDay: player.gameDay,
          },
        }),
      ]);

      return NextResponse.json({ loan }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/banking:", error);
    return NextResponse.json({ error: "Banking operation failed" }, { status: 500 });
  }
}
