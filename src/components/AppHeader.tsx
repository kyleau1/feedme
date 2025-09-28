"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";

const HIDE_NAV_PATHS: RegExp[] = [
  /^\/$/,
  /^\/sign-in(\/.*)?$/,
  /^\/sign-up(\/.*)?$/,
  /^\/custom-signup(\/.*)?$/,
];

export default function AppHeader() {
  const pathname = usePathname();

  const shouldHideNav = HIDE_NAV_PATHS.some((pattern) => pattern.test(pathname));
  if (shouldHideNav) return null;

  return <Navigation />;
}

