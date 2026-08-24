import { prisma } from "@/lib/prisma";
import { AuthenticationError } from "@/lib/auth";
import { requireCurrentUser } from "@/lib/current-user";

export interface AccountDTO {
  id: string;
  username: string;
  displayName: string | null;
  role: "admin" | "user";
  createdAt: string;
}

function accountToDTO(account: {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
}): AccountDTO {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    role: account.role === "admin" ? "admin" : "user",
    createdAt: account.createdAt.toISOString(),
  };
}

async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "admin") throw new AuthenticationError("Administrator access is required.");
  return user;
}

export async function listAccounts(): Promise<AccountDTO[]> {
  await requireAdmin();
  const accounts = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return accounts.map(accountToDTO);
}

export async function updateAccountRole(id: string, role: AccountDTO["role"]): Promise<AccountDTO> {
  const currentUser = await requireAdmin();
  if (id === currentUser.id) {
    throw new AuthenticationError("You cannot change your own administrator role.");
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.user.findUnique({ where: { id } });
    if (!account) throw new AuthenticationError("Account not found.");
    if (account.role === "admin" && role === "user") {
      const adminCount = await tx.user.count({ where: { role: "admin" } });
      if (adminCount === 1) {
        throw new AuthenticationError("At least one administrator account is required.");
      }
    }

    return accountToDTO(await tx.user.update({ where: { id }, data: { role } }));
  });
}

export async function deleteAccount(id: string) {
  const currentUser = await requireCurrentUser();
  if (currentUser.role !== "admin" && id !== currentUser.id) {
    throw new AuthenticationError("Administrator access is required.");
  }
  return prisma.$transaction(async (tx) => {
    const account = await tx.user.findUnique({
      where: { id },
      include: {
        historyEntries: {
          include: {
            journalEntries: {
              include: { attachments: { select: { storageKey: true } } },
            },
          },
        },
      },
    });
    if (!account) throw new AuthenticationError("Account not found.");
    if (account.role === "admin") {
      if (currentUser.role !== "admin") {
        throw new AuthenticationError("Administrator access is required.");
      }
      const adminCount = await tx.user.count({ where: { role: "admin" } });
      if (adminCount === 1) {
        throw new AuthenticationError(
          "Promote another account before deleting the final administrator."
        );
      }
    }

    const screenshotStorageKeys = account.historyEntries.flatMap((entry) =>
      entry.journalEntries.flatMap((journal) =>
        journal.attachments.map((attachment) => attachment.storageKey)
      )
    );
    await tx.user.delete({ where: { id } });
    return { deletedOwnAccount: id === currentUser.id, screenshotStorageKeys };
  });
}

export async function getManagedAccount(id: string): Promise<AccountDTO | null> {
  const currentUser = await requireCurrentUser();
  if (currentUser.role !== "admin" && currentUser.id !== id) {
    throw new AuthenticationError("Administrator access is required.");
  }
  const account = await prisma.user.findUnique({ where: { id } });
  return account ? accountToDTO(account) : null;
}
