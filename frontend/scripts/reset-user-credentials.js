#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { randomBytes, scrypt: scryptCallback } = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(scryptCallback);
const KEY_LEN = 64;

function normalizePassword(password) {
  return password.normalize("NFKC");
}

function validatePasswordPolicy(password) {
  const normalized = normalizePassword(password);
  if (normalized.length < 8) return "Password must be at least 8 characters.";
  if (normalized.length > 128) return "Password is too long.";
  return null;
}

async function hashPassword(password) {
  const normalized = normalizePassword(password);
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(normalized, salt, KEY_LEN);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

function parseArgs(argv) {
  const options = {
    password: "",
    emails: [],
    allUsers: false,
    orphanedOnly: true,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--password") {
      options.password = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg.startsWith("--password=")) {
      options.password = arg.slice("--password=".length);
      continue;
    }
    if (arg === "--email") {
      const email = (argv[i + 1] ?? "").trim().toLowerCase();
      if (email) options.emails.push(email);
      i += 1;
      continue;
    }
    if (arg.startsWith("--email=")) {
      const email = arg.slice("--email=".length).trim().toLowerCase();
      if (email) options.emails.push(email);
      continue;
    }
    if (arg === "--all-users") {
      options.allUsers = true;
      options.orphanedOnly = false;
      continue;
    }
    if (arg === "--orphaned-users") {
      options.orphanedOnly = true;
      options.allUsers = false;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
  }

  if (options.emails.length > 0) {
    options.allUsers = false;
    options.orphanedOnly = false;
    options.emails = [...new Set(options.emails)];
  }

  return options;
}

function buildWhereClause(options) {
  if (options.emails.length > 0) {
    return { email: { in: options.emails } };
  }
  if (options.allUsers) {
    return {};
  }
  return { passwordHash: null, cognitoSub: null };
}

function usage() {
  console.log(
    [
      "Usage:",
      "  npm run auth:reset-credentials -- --password '<new-password>' [--orphaned-users]",
      "  npm run auth:reset-credentials -- --password '<new-password>' --email user@company.com",
      "  npm run auth:reset-credentials -- --password '<new-password>' --all-users",
      "",
      "Options:",
      "  --password         New password to set (required).",
      "  --email            Target email (repeatable).",
      "  --orphaned-users   Only users missing both passwordHash and cognitoSub (default).",
      "  --all-users        Reset all users in DB.",
      "  --dry-run          Show which users would be updated without writing changes.",
    ].join("\n")
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.password) {
    usage();
    process.exitCode = 1;
    return;
  }

  const passwordError = validatePasswordPolicy(options.password);
  if (passwordError) {
    console.error(`Invalid password: ${passwordError}`);
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const where = buildWhereClause(options);
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, passwordHash: true, cognitoSub: true },
      orderBy: { email: "asc" },
    });

    if (users.length === 0) {
      console.log("No users matched the reset criteria.");
      return;
    }

    console.log(`Matched ${users.length} user(s):`);
    for (const user of users) {
      const mode = user.passwordHash
        ? "password"
        : user.cognitoSub
          ? "sso"
          : "orphaned";
      console.log(`- ${user.email} [${mode}]`);
    }

    if (options.dryRun) {
      console.log("Dry run complete. No changes written.");
      return;
    }

    for (const user of users) {
      const passwordHash = await hashPassword(options.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    console.log(`Successfully reset credentials for ${users.length} user(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
