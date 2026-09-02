/**
 * One-shot: set / reset admin login to admin@nexpertsacademy.com / admin@123
 * Usage: npx tsx src/db/ensureAdmin.ts
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { roles, userRoles, users } from "./schema";

const ADMIN_EMAIL = "admin@nexpertsacademy.com";
const ADMIN_PASSWORD = "admin@123";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [byNew] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  const [byLegacy] = await db.select().from(users).where(eq(users.email, "admin@nexperts.com")).limit(1);

  let userId: number;
  if (byNew) {
    await db.update(users).set({ passwordHash, status: "ACTIVE" }).where(eq(users.id, byNew.id));
    userId = byNew.id;
    console.log(`Updated password for ${ADMIN_EMAIL}`);
  } else if (byLegacy) {
    await db
      .update(users)
      .set({ email: ADMIN_EMAIL, passwordHash, status: "ACTIVE" })
      .where(eq(users.id, byLegacy.id));
    userId = byLegacy.id;
    console.log(`Migrated admin@nexperts.com → ${ADMIN_EMAIL}`);
  } else {
    const result = await db.insert(users).values({
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: "Admin",
      lastName: "Nexperts",
      phone: "9876500001",
      status: "ACTIVE",
    });
    userId = Number(result[0].insertId);
    console.log(`Created ${ADMIN_EMAIL}`);
  }

  const [superRole] = await db.select().from(roles).where(eq(roles.name, "SUPER_ADMIN")).limit(1);
  if (superRole) {
    const [link] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);
    if (!link) {
      await db.insert(userRoles).values({ userId, roleId: superRole.id });
      console.log("Assigned SUPER_ADMIN role");
    }
  } else {
    console.warn("SUPER_ADMIN role missing — run full db:seed after migrate");
  }

  console.log(`\nAdmin login:\n  Email:    ${ADMIN_EMAIL}\n  Password: ${ADMIN_PASSWORD}\n`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
