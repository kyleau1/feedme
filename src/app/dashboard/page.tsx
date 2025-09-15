// src/app/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  // Not signed in → redirect to sign-in
  if (!user) redirect("/sign-in");

  // Default role is "employee"
  const role = user.publicMetadata?.role ?? "employee";

  if (role === "admin") {
    redirect("/manager-dashboard");
  } else {
    redirect("/order");
  }

  return null;
}
