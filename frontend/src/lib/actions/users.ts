"use server";

import { prisma } from "@/lib/prisma";
import { invalidateRbacCache } from "@/lib/auth";
import type { User, InfraPreferences } from "@/lib/types";
import type { User as PrismaUser } from "@prisma/client";

// ─── Mapper ─────────────────────────────────────────────────────

function mapPrismaToUser(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    interests: (row.interests as string[]) ?? [],
    accountType: (row.accountType as User["accountType"]) ?? "personal",
    onboardingComplete: row.onboardingComplete,
    experienceAreas: (row.experienceAreas as string[]) ?? [],
    emergingInterests: (row.emergingInterests as string[]) ?? [],
    termsAcceptedAt: row.termsAcceptedAt?.toISOString() ?? null,
    infraPreferences: (row.infraPreferences as InfraPreferences | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Read Actions ────────────────────────────────────────────────

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

// ─── Write Actions ───────────────────────────────────────────────

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
      onboardingComplete: false,
    },
  });
  return mapPrismaToUser(row);
}

export async function updateDbUser(
  id: string,
  updates: Partial<Pick<User, "name" | "email" | "interests" | "experienceAreas" | "emergingInterests" | "onboardingComplete">>
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

// ─── Onboarding Actions ──────────────────────────────────────────

export async function acceptTerms(userId: string): Promise<User | null> {
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { termsAcceptedAt: new Date() },
    });
    invalidateRbacCache(userId);
    return mapPrismaToUser(row);
  } catch {
    return null;
  }
}

export async function completeOnboarding(
  userId: string,
  data: {
    experienceAreas: string[];
    emergingInterests: string[];
  }
): Promise<User | null> {
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        experienceAreas: data.experienceAreas,
        emergingInterests: data.emergingInterests,
        // Merge both into the legacy interests field for backward compat
        interests: [...new Set([...data.experienceAreas, ...data.emergingInterests])],
        onboardingComplete: true,
      },
    });
    // Invalidate RBAC cache so the next updateSession() / JWT refresh
    // picks up onboardingComplete: true from the DB instead of stale cache
    invalidateRbacCache(userId);
    return mapPrismaToUser(row);
  } catch {
    return null;
  }
}

// ─── Infrastructure Preferences ──────────────────────────────────

export async function updateInfraPreferences(
  userId: string,
  prefs: InfraPreferences
): Promise<User | null> {
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { infraPreferences: JSON.parse(JSON.stringify(prefs)) },
    });
    return mapPrismaToUser(row);
  } catch {
    return null;
  }
}

export async function getInfraPreferences(
  userId: string
): Promise<InfraPreferences | null> {
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { infraPreferences: true },
    });
    return (row?.infraPreferences as InfraPreferences | null) ?? null;
  } catch {
    return null;
  }
}
