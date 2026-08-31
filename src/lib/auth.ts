import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);

export { SESSION_COOKIE } from "@/lib/auth-constants";
export const PLACEHOLDER_PASSWORD_HASH = "unset-no-auth-yet";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;
const MINIMUM_PASSWORD_LENGTH = 12;

export class AuthenticationError extends Error {}

export function sessionCookieOptions(isSecure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
  };
}

export function validateCredentials(username: string, password?: string) {
  if (!USERNAME_PATTERN.test(username)) {
    throw new AuthenticationError(
      "Username must be 3-32 characters using letters, numbers, hyphens, or underscores."
    );
  }
  if (password && password.length < MINIMUM_PASSWORD_LENGTH) {
    throw new AuthenticationError("Password must be at least 12 characters.");
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  return token;
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
}

export async function registerAccount(
  username: string,
  password: string | undefined,
  displayName?: string
) {
  validateCredentials(username, password);
  const passwordHash = password ? await hashPassword(password) : null;
  const normalizedUsername = username.toLowerCase();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { username: normalizedUsername } });
    if (existing) throw new AuthenticationError("That username is already in use.");

    const placeholder = await tx.user.findFirst({
      where: { passwordHash: PLACEHOLDER_PASSWORD_HASH },
    });
    if (placeholder) {
      return tx.user.update({
        where: { id: placeholder.id },
        data: {
          username: normalizedUsername,
          displayName: displayName?.trim() || null,
          passwordHash,
          role: "admin",
        },
      });
    }

    const accountCount = await tx.user.count();
    return tx.user.create({
      data: {
        username: normalizedUsername,
        displayName: displayName?.trim() || null,
        passwordHash,
        role: accountCount === 0 ? "admin" : "user",
      },
    });
  });
}

export async function authenticateAccount(username: string, password?: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!user || (user.passwordHash && !(await verifyPassword(password ?? "", user.passwordHash)))) {
    throw new AuthenticationError("Invalid username or password.");
  }

  return user;
}

export async function updateOwnPassword(
  currentPassword: string | undefined,
  newPassword: string | undefined
) {
  const { requireCurrentUser } = await import("@/lib/current-user");
  const user = await requireCurrentUser();
  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new AuthenticationError("Your current password is incorrect.");
    }
  }
  if (newPassword) validateCredentials(user.username, newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPassword ? await hashPassword(newPassword) : null },
  });
}

export async function listLoginAccounts() {
  const accounts = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { username: true, displayName: true, passwordHash: true },
  });
  return accounts.map((account) => ({
    username: account.username,
    displayName: account.displayName,
    requiresPassword: Boolean(account.passwordHash),
  }));
}

export async function needsAccountSetup(): Promise<boolean> {
  return Boolean(
    await prisma.user.findFirst({ where: { passwordHash: PLACEHOLDER_PASSWORD_HASH } })
  );
}
