import { Router, type IRouter } from "express";
import { eq, or, desc } from "drizzle-orm";
import { db, usersTable, transfersTable } from "@workspace/db";
import {
  TransferPointsBody,
  GetUserTransfersParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/transfers", async (req, res): Promise<void> => {
  const parsed = TransferPointsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fromUserId, toUserId, amount } = parsed.data;

  if (fromUserId === toUserId) {
    res.status(400).json({ error: "Cannot transfer to yourself" });
    return;
  }

  const [fromUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, fromUserId));

  if (!fromUser) {
    res.status(404).json({ error: "Sender not found" });
    return;
  }

  if (Number(fromUser.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const [toUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, toUserId));

  if (!toUser) {
    res.status(404).json({ error: "Recipient not found" });
    return;
  }

  await db
    .update(usersTable)
    .set({ balance: String(Number(fromUser.balance) - amount) })
    .where(eq(usersTable.id, fromUserId));

  await db
    .update(usersTable)
    .set({ balance: String(Number(toUser.balance) + amount) })
    .where(eq(usersTable.id, toUserId));

  const id = randomUUID();
  const [transfer] = await db
    .insert(transfersTable)
    .values({
      id,
      fromUserId,
      toUserId,
      fromUsername: fromUser.username,
      toUsername: toUser.username,
      amount: String(amount),
    })
    .returning();

  res.json({
    id: transfer.id,
    fromUserId: transfer.fromUserId,
    toUserId: transfer.toUserId,
    fromUsername: transfer.fromUsername,
    toUsername: transfer.toUsername,
    amount: Number(transfer.amount),
    createdAt: transfer.createdAt.toISOString(),
  });
});

router.get("/transfers/:userId", async (req, res): Promise<void> => {
  const params = GetUserTransfersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const records = await db
    .select()
    .from(transfersTable)
    .where(
      or(
        eq(transfersTable.fromUserId, params.data.userId),
        eq(transfersTable.toUserId, params.data.userId),
      ),
    )
    .orderBy(desc(transfersTable.createdAt))
    .limit(50);

  res.json(
    records.map((t) => ({
      id: t.id,
      fromUserId: t.fromUserId,
      toUserId: t.toUserId,
      fromUsername: t.fromUsername,
      toUsername: t.toUsername,
      amount: Number(t.amount),
      createdAt: t.createdAt.toISOString(),
    })),
  );
});

export default router;
