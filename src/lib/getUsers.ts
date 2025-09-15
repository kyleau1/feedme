// src/lib/getUsers.ts
import { clerkClient } from "@clerk/nextjs/server";

export async function getUserNames(userIds: string[]) {
  const clerk = await clerkClient();
  const users = await clerk.users.getUserList({ userId: userIds });
  const map: Record<string, string> = {};
  users.data.forEach((u: any) => {
    map[u.id] = u.firstName || "Unknown";
  });
  return map;
}
