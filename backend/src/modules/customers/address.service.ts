import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { addresses } from "../../db/schema";
import { AppError } from "../../utils/http";

export const addressSchema = z.object({
  fullName: z.string().min(2).max(150),
  phone: z.string().min(8).max(30),
  line1: z.string().min(3).max(255),
  line2: z.string().max(255).optional().nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(20),
  country: z.string().min(2).max(80).default("Malaysia"),
  isDefault: z.boolean().optional(),
  label: z.string().max(40).optional(),
});

export async function listAddresses(userId: number) {
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function createAddress(userId: number, input: z.infer<typeof addressSchema>) {
  if (input.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  const result = await db.insert(addresses).values({ ...input, userId, line2: input.line2 ?? null });
  return { id: Number(result[0].insertId), ...input, userId };
}

export async function updateAddress(userId: number, id: number, input: z.infer<typeof addressSchema>) {
  const [row] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Address not found", 404);
  if (input.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  await db.update(addresses).set({ ...input, line2: input.line2 ?? null }).where(eq(addresses.id, id));
  return { ...row, ...input };
}

export async function deleteAddress(userId: number, id: number) {
  const [row] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Address not found", 404);
  await db.delete(addresses).where(eq(addresses.id, id));
}

export async function setDefaultAddress(userId: number, id: number) {
  const [row] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Address not found", 404);
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, id));
}
