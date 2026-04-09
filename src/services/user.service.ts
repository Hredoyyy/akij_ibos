import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}

export async function createOrUpdateUser(
  clerkId: string,
  email: string,
  name: string | null,
  role: Role = 'CANDIDATE'
) {
  return prisma.user.upsert({
    where: { clerkId },
    update: { email, name, role },
    create: { clerkId, email, name, role },
  });
}
