import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pgPoolMax = Number.parseInt(process.env.PG_POOL_MAX ?? "1", 10);
const adapter = new PrismaPg({
  connectionString,
  // Keep the pool tiny by default for serverless + Supabase session mode to avoid max-client spikes.
  max: Number.isFinite(pgPoolMax) && pgPoolMax > 0 ? pgPoolMax : 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
