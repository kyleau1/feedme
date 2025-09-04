// src/lib/getUsers.ts
import { clerkClient } from "@clerk/nextjs/server";

export async function getUserNames(userIds: string[]) {
  const users = await clerkClient.users.getUserList({ userId: userIds });
  const map: Record<string, string> = {};
  users.forEach(u => {
    map[u.id] = u.firstName || "Unknown";
  });
  return map;
}
