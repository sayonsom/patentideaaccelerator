"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import type { AIProvider } from "@/lib/types";

interface SavedApiKey {
  id: string;
  provider: AIProvider;
  keyPrefix: string;
  keySuffix: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Save or update an API key for a user+provider. Key is encrypted before storage. */
export async function saveApiKey(
  userId: string,
  provider: AIProvider,
  plainKey: string
): Promise<SavedApiKey> {
  const encryptedKey = encrypt(plainKey);
  const keyPrefix = plainKey.slice(0, 7);
  const keySuffix = plainKey.slice(-4);

  const row = await prisma.userApiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      encryptedKey,
      keyPrefix,
      keySuffix,
      isActive: true,
    },
    update: {
      encryptedKey,
      keyPrefix,
      keySuffix,
      isActive: true,
    },
  });

  return {
    id: row.id,
    provider: row.provider as AIProvider,
    keyPrefix: row.keyPrefix,
    keySuffix: row.keySuffix,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** List all API keys for a user (no decrypted values -- only prefix/suffix). */
export async function listApiKeys(userId: string): Promise<SavedApiKey[]> {
  const rows = await prisma.userApiKey.findMany({
    where: { userId },
    orderBy: { provider: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    provider: row.provider as AIProvider,
    keyPrefix: row.keyPrefix,
    keySuffix: row.keySuffix,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/** Decrypt and return the active API key for a user+provider. Returns null if not found or revoked. */
export async function getDecryptedKey(
  userId: string,
  provider: AIProvider
): Promise<string | null> {
  const row = await prisma.userApiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!row || !row.isActive) return null;

  try {
    return decrypt(row.encryptedKey);
  } catch {
    return null;
  }
}

/** Revoke (soft-delete) an API key. */
export async function revokeApiKey(
  userId: string,
  provider: AIProvider
): Promise<void> {
  await prisma.userApiKey.updateMany({
    where: { userId, provider },
    data: { isActive: false },
  });
}

/** Hard-delete an API key. */
export async function deleteApiKey(
  userId: string,
  provider: AIProvider
): Promise<void> {
  await prisma.userApiKey.deleteMany({
    where: { userId, provider },
  });
}

/** Get the user's active provider preference. Stored as a simple user setting. */
export async function getUserActiveProvider(userId: string): Promise<AIProvider> {
  // We store this in the user's first active key ordering, or default to anthropic
  const keys = await prisma.userApiKey.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 1,
  });
  return (keys[0]?.provider as AIProvider) ?? "anthropic";
}
