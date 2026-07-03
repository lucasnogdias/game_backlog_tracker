import { prisma } from "@/lib/prisma";

/**
 * Temporary stand-in for real authentication (login screen is deferred —
 * see project plan). Returns the first user in the system, creating a
 * default admin user if none exists yet, so every Backlog/History record
 * can already be scoped to a `userId` ahead of building real auth.
 *
 * `passwordHash` is a placeholder until login is implemented; real
 * passwords will be hashed with bcrypt at that point.
 */
export async function getOrCreateDefaultUser() {
  const existingUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      username: "local",
      displayName: "Local User",
      passwordHash: "unset-no-auth-yet",
      role: "admin",
    },
  });
}
