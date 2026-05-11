import { Router, type IRouter } from "express";
import { eq, desc, sum, count, max } from "drizzle-orm";
import { db, gameRoundsTable } from "@workspace/db";
import {
  GetGameHistoryParams,
  RecordGameRoundBody,
  GetGameStatsParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/games/history/:userId", async (req, res): Promise<void> => {
  const params = GetGameHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const records = await db
    .select()
    .from(gameRoundsTable)
    .where(eq(gameRoundsTable.userId, params.data.userId))
    .orderBy(desc(gameRoundsTable.createdAt))
    .limit(20);

  res.json(
    records.map((r) => ({
      id: r.id,
      userId: r.userId,
      betAmount: Number(r.betAmount),
      multiplier: Number(r.multiplier),
      cashoutMultiplier: r.cashoutMultiplier != null ? Number(r.cashoutMultiplier) : null,
      won: r.won,
      profit: r.profit != null ? Number(r.profit) : null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/games/record", async (req, res): Promise<void> => {
  const parsed = RecordGameRoundBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, betAmount, multiplier, cashoutMultiplier, won, profit } = parsed.data;

  const id = randomUUID();
  const [round] = await db
    .insert(gameRoundsTable)
    .values({
      id,
      userId,
      betAmount: String(betAmount),
      multiplier: String(multiplier),
      cashoutMultiplier: cashoutMultiplier != null ? String(cashoutMultiplier) : null,
      won,
      profit: profit != null ? String(profit) : null,
    })
    .returning();

  res.status(201).json({
    id: round.id,
    userId: round.userId,
    betAmount: Number(round.betAmount),
    multiplier: Number(round.multiplier),
    cashoutMultiplier: round.cashoutMultiplier != null ? Number(round.cashoutMultiplier) : null,
    won: round.won,
    profit: round.profit != null ? Number(round.profit) : null,
    createdAt: round.createdAt.toISOString(),
  });
});

router.get("/games/stats/:userId", async (req, res): Promise<void> => {
  const params = GetGameStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const allRounds = await db
    .select()
    .from(gameRoundsTable)
    .where(eq(gameRoundsTable.userId, params.data.userId));

  const totalRounds = allRounds.length;
  const wonRounds = allRounds.filter((r) => r.won);
  const lostRounds = allRounds.filter((r) => !r.won);
  const totalWon = wonRounds.length;
  const totalLost = lostRounds.length;
  const biggestWin = wonRounds.reduce((max, r) => {
    const p = r.profit != null ? Number(r.profit) : 0;
    return p > max ? p : max;
  }, 0);
  const totalProfit = allRounds.reduce((sum, r) => {
    return sum + (r.profit != null ? Number(r.profit) : 0);
  }, 0);

  res.json({ totalRounds, totalWon, totalLost, biggestWin, totalProfit });
});

export default router;
