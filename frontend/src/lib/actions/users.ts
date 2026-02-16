"use server";

import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/types";
import type { User as PrismaUser } from "@prisma/client";

// ─── Mapper ─────────────────────────────────────────────────────

function mapPrismaToUser(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    interests: (row.interests as string[]) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Actions ────────────────────────────────────────────────────

export async function getUserByCognitoSub(sub: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { cognitoSub: sub } });
  return row ? mapPrismaToUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { email } });
  return row ? mapPrismaToUser(row) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? mapPrismaToUser(row) : null;
}

export async function createDbUser(data: {
  email: string;
  name: string;
  cognitoSub: string;
}): Promise<User> {
  const row = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      cognitoSub: data.cognitoSub,
      interests: [],
    },
  });
  return mapPrismaToUser(row);
}

export async function updateDbUser(
  id: string,
  updates: Partial<Pick<User, "name" | "email" | "interests">>
): Promise<User | null> {
  try {
    const row = await prisma.user.update({
      where: { id },
      data: updates,
    });
    return mapPrismaToUser(row);
  } catch {
    return null;
  }
}
