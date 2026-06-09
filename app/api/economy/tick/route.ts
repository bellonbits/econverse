import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { tickEconomy, calculateDailyExpenses, calculateNetWorth, calculateTax } from "@/lib/economy-engine";
import { simulateMarketTick } from "@/lib/market-engine";
import { generateRandomEvent, createGameEvent } from "@/lib/event-engine";
import { GameEvent } from "@/types/game";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, days = 1 } = body;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        businesses: { include: { employees: true } },
        investments: true,
        properties: true,
        loans: true,
        bankAccounts: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const currentEconomy = await prisma.economy.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!currentEconomy) {
      return NextResponse.json({ error: "Economy not initialized" }, { status: 500 });
    }

    const activeEvents = await prisma.gameEvent.findMany({
      where: { isActive: true },
    });

    const parsedActiveEvents: GameEvent[] = activeEvents.map((e) => ({
      ...e,
      type: e.type as GameEvent["type"],
      impacts: JSON.parse(e.impacts),
    }));

    let economy = currentEconomy;
    let playerMoney = player.money;
    let playerSavings = player.savings;
    let playerDebt = player.debt;
    let playerHappiness = player.happiness;
    let playerHealth = player.health;
    const newTransactions = [];
    let newGameDay = player.gameDay;

    for (let d = 0; d < days; d++) {
      newGameDay++;

      // Tick economy
      const tick = tickEconomy(economy as any, parsedActiveEvents);

      // Update economy in DB every 7 days
      if (newGameDay % 7 === 0) {
        economy = await prisma.economy.create({
          data: {
            ...tick.economy,
            gameDay: newGameDay,
            taxRevenue: economy.taxRevenue,
            governmentSpending: economy.governmentSpending,
            tradeBalance: economy.tradeBalance,
            populationGrowth: economy.populationGrowth,
          } as any,
        });
      }

      // Daily expenses
      const expenses = calculateDailyExpenses(player.employment, player.country);
      playerMoney -= expenses.total;

      newTransactions.push({
        playerId,
        type: "expense",
        category: "living_expenses",
        amount: -expenses.total,
        description: `Daily living expenses (food, rent, transport...)`,
        balance: playerMoney,
        gameDay: newGameDay,
      });

      // Daily salary (if employed)
      if (player.salary > 0 && newGameDay % 30 === 0) {
        const dailySalary = player.salary / 365;
        const tax = calculateTax(dailySalary * 30, 22);
        const netSalary = dailySalary * 30 - tax;
        playerMoney += netSalary;

        newTransactions.push({
          playerId,
          type: "salary",
          category: "employment",
          amount: netSalary,
          description: `Monthly salary (after ${22}% income tax)`,
          balance: playerMoney,
          gameDay: newGameDay,
        });
      }

      // Business income (daily)
      for (const business of player.businesses) {
        if (!business.isActive) continue;

        const demandMultiplier = tick.demandMultiplier ?? 1;
        const priceMultiplier = tick.priceMultiplier ?? 1;

        // Calculate daily revenue
        const dailyRevenue = business.revenue * demandMultiplier * (Math.random() * 0.4 + 0.8);
        const dailyExpenses = business.expenses * priceMultiplier * (Math.random() * 0.3 + 0.85);
        const dailyProfit = dailyRevenue - dailyExpenses;

        if (dailyProfit !== 0) {
          playerMoney += dailyProfit;
          newTransactions.push({
            playerId,
            type: "business",
            category: business.category,
            amount: dailyProfit,
            description: `${business.name} daily ${dailyProfit >= 0 ? "profit" : "loss"}`,
            balance: playerMoney,
            gameDay: newGameDay,
          });
        }
      }

      // Savings interest (monthly)
      if (playerSavings > 0 && newGameDay % 30 === 0) {
        const savingsAccount = player.bankAccounts.find((a) => a.type === "savings");
        const rate = savingsAccount?.interestRate ?? 0.02;
        const monthlyInterest = (playerSavings * rate) / 12;
        playerSavings += monthlyInterest;

        if (monthlyInterest > 0.01) {
          newTransactions.push({
            playerId,
            type: "interest",
            category: "savings",
            amount: monthlyInterest,
            description: `Savings account interest (${(rate * 100).toFixed(2)}% APY)`,
            balance: playerMoney + playerSavings,
            gameDay: newGameDay,
          });
        }
      }

      // Loan payments (monthly)
      if (newGameDay % 30 === 0) {
        for (const loan of player.loans) {
          if (loan.isPaid) continue;
          const payment = Math.min(loan.monthlyPayment, loan.remaining);
          playerMoney -= payment;
          playerDebt -= payment;

          newTransactions.push({
            playerId,
            type: "loan",
            category: "debt_payment",
            amount: -payment,
            description: `${loan.type} loan payment`,
            balance: playerMoney,
            gameDay: newGameDay,
          });
        }
      }

      // Property rental income (monthly)
      if (newGameDay % 30 === 0) {
        for (const property of player.properties) {
          if (property.isRented && property.monthlyRent > 0) {
            playerMoney += property.monthlyRent;
            newTransactions.push({
              playerId,
              type: "rent",
              category: "real_estate",
              amount: property.monthlyRent,
              description: `Rental income from ${property.name}`,
              balance: playerMoney,
              gameDay: newGameDay,
            });
          }
        }
      }

      // Happiness decay
      playerHappiness = Math.max(10, Math.min(100,
        playerHappiness - 0.1 + (playerMoney > 0 ? 0.05 : -0.3)
      ));

      // Health decay
      playerHealth = Math.max(10, Math.min(100, playerHealth - 0.02));

      // Random events (every 7 days, small probability)
      if (newGameDay % 7 === 0) {
        const event = generateRandomEvent(newGameDay, {
          gdpGrowth: economy.gdpGrowth,
          unemployment: economy.unemployment,
        });

        if (event) {
          const gameEvent = createGameEvent(event, newGameDay);
          await prisma.gameEvent.create({
            data: {
              ...gameEvent,
              impacts: JSON.stringify(gameEvent.impacts),
            },
          });
        }
      }
    }

    // Update investments with market simulation
    const markets = await prisma.market.findMany();
    const currentEco = await prisma.economy.findFirst({ orderBy: { createdAt: "desc" } });
    const investmentMultiplier = 1 + ((currentEco?.gdpGrowth ?? 2.5) / 100);

    const updatedMarkets = simulateMarketTick(markets as any, investmentMultiplier);
    for (const market of updatedMarkets) {
      await prisma.market.update({
        where: { id: market.id },
        data: {
          previousPrice: market.previousPrice,
          price: market.price,
          change: market.change,
          changePercent: market.changePercent,
          volume: market.volume,
          updatedAt: new Date(),
        },
      });
    }

    // Update player investments values
    for (const investment of player.investments) {
      const market = updatedMarkets.find((m) => m.symbol === investment.symbol);
      if (market) {
        const newValue = market.price * investment.quantity;
        const gainLoss = newValue - (investment.buyPrice * investment.quantity);
        const gainLossPercent = ((market.price - investment.buyPrice) / investment.buyPrice) * 100;

        await prisma.investment.update({
          where: { id: investment.id },
          data: {
            currentPrice: market.price,
            totalValue: newValue,
            gainLoss,
            gainLossPercent,
          },
        });
      }
    }

    // Compute net worth
    const investmentsTotal = player.investments.reduce((sum, inv) => sum + inv.totalValue, 0);
    const propertiesTotal = player.properties.reduce((sum, p) => sum + p.currentValue, 0);
    const netWorth = playerMoney + playerSavings + investmentsTotal + propertiesTotal - playerDebt;

    // Batch insert transactions
    if (newTransactions.length > 0) {
      await prisma.transaction.createMany({ data: newTransactions });
    }

    // Update player
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        money: Math.round(playerMoney * 100) / 100,
        savings: Math.round(playerSavings * 100) / 100,
        debt: Math.max(0, Math.round(playerDebt * 100) / 100),
        happiness: Math.round(playerHappiness * 10) / 10,
        health: Math.round(playerHealth * 10) / 10,
        netWorth: Math.round(netWorth * 100) / 100,
        gameDay: newGameDay,
      },
    });

    const finalEconomy = await prisma.economy.findFirst({ orderBy: { createdAt: "desc" } });

    return NextResponse.json({
      player: updatedPlayer,
      economy: finalEconomy,
      markets: updatedMarkets,
      transactionsAdded: newTransactions.length,
    });
  } catch (error) {
    console.error("POST /api/economy/tick:", error);
    return NextResponse.json({ error: "Failed to advance time" }, { status: 500 });
  }
}
