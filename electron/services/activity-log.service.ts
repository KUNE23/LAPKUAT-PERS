import type { PrismaClient } from "@prisma/client";

export type ActivityType = "SUCCESS" | "WARNING" | "DANGER" | "INFO";
export interface ActivityInput {
  type: ActivityType;
  title: string;
  description: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(prisma: PrismaClient, input: ActivityInput) {
  return prisma.$executeRawUnsafe(
    'INSERT INTO "ActivityLog" ("type","title","description","performedBy","metadata") VALUES (?,?,?,?,?)',
    input.type,
    input.title,
    input.description,
    input.performedBy,
    input.metadata ? JSON.stringify(input.metadata) : null,
  );
}
export async function getLatestActivities(prisma: PrismaClient, limit = 10) {
  return prisma.$queryRawUnsafe(
    'SELECT "id","type","title","description","performedBy","createdAt" FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT ?',
    Math.min(Math.max(limit, 1), 100),
  );
}
export async function getAllActivities(prisma: PrismaClient) {
  return prisma.$queryRawUnsafe(
    'SELECT "id","type","title","description","performedBy","createdAt" FROM "ActivityLog" ORDER BY "createdAt" DESC',
  );
}
export async function clearActivities(prisma: PrismaClient) {
  return prisma.$executeRawUnsafe('DELETE FROM "ActivityLog"');
}
