import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterUserBody,
  GetUserParams,
  UpdateBalanceParams,
  UpdateBalanceBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/users/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing.length > 0) {
    const u = existing[0];
    res.json({
      id: u.id,
      username: u.username,
      balance: Number(u.balance),
      createdAt: u.createdAt.toISOString(),
    });
    return;
  }

  const id = randomUUID();
  const [user] = await db
    .insert(usersTable)
    .values({ id, username, balance: "10000" })
    .returning();

  res.json({
    id: user.id,
    username: user.username,
    balance: Number(user.balance),
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    balance: Number(user.balance),
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/:userId/balance", async (req, res): Promise<void> => {
  const params = UpdateBalanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateBalanceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.userId));

  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = Number(existing.balance) + body.data.amount;
  if (newBalance < 0) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ balance: String(newBalance) })
    .where(eq(usersTable.id, params.data.userId))
    .returning();

  res.json({
    id: user.id,
    username: user.username,
    balance: Number(user.balance),
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
