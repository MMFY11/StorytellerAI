// components/Header.tsx
"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { FilePen, BookOpen } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="relative p-16 flex items-center justify-between bg-gradient-to-r from-purple-600 to-white-500 overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-60">
        <DotLottieReact
          src="https://lottie.host/fe52fa19-9f1b-4bc0-a5dc-9d3ba2e17a73/TjhFY1CrhT.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </div>

      {/* Left Side Lottie Animation */}
      <div className="absolute bottom-[-1cm] left-[10cm] transform -translate-x-1/2 w-30 h-30 lg:w-48 lg:h-48 z-10">
        <DotLottieReact
          src="https://lottie.host/df3f76aa-52e1-4918-8f08-daf4d3d14e03/uSgTaqHEHF.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </div>

      {/* Left nav icons */}
      <div className="relative z-10 flex space-x-4">
        <Link href="/" className="text-white hover:opacity-80">
          <FilePen className="w-8 h-8" />
        </Link>
        <Link href="/stories" className="text-white hover:opacity-80">
          <BookOpen className="w-8 h-8" />
        </Link>
      </div>

      {/* Center branding */}
      <div className="relative z-10 text-center text-white">
        <Link href="/" className="hover:opacity-80">
          <h1 className="text-6xl font-bold">Kidotopia</h1>
          <p className="text-2xl">Making your stories come alive!</p>
        </Link>
      </div>

      {/* Right auth buttons */}
      <div className="relative z-10 flex space-x-4">
        {session ? (
          <>
            <span className="text-white mr-2">
              Hello, {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Register
            </Link>
          </>
        )}
      </div>

      {/* Right Side Lottie Animation */}
      <div className="absolute bottom-[-1cm] right-[10cm] transform -translate-x-1/2 w-40 h-40 lg:w-48 lg:h-48 z-10">
        <DotLottieReact
          src="https://lottie.host/cb145cc9-7040-4207-be25-a2729d0759f3/W5ComT4uuT.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </div>
    </header>
  );
}
