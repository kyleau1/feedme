"use client";

import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { signOut } = useClerk();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign Up
          </Link>
          <Link
            href="/sign-in"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Sign In
          </Link>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
