import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  // Resolve relative paths to an absolute path so all server contexts use the same DB
  let url = raw;
  if (raw.startsWith("file:")) {
    const filePath = raw.slice(5);
    if (!path.isAbsolute(filePath)) {
      url = `file:${path.resolve(filePath)}`;
    }
  }
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
