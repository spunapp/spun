"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function Nav() {
  const { isSignedIn, isLoaded } = useUser();
  const ctaHref = isLoaded && isSignedIn ? "/chat" : "/pricing";

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="px-4 md:px-14 lg:px-20 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="Spun" width={22} height={22} />
            <span className="font-mono font-medium text-gray-900 tracking-tight">spun</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-900 transition">
              How it works
            </a>
            <a href="#features" className="hover:text-gray-900 transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-gray-900 transition">
              Pricing
            </a>
            <Link href="/login" className="hover:text-gray-900 transition">
              Sign in
            </Link>
          </div>

          <Link
            href={ctaHref}
            className="bg-spun hover:bg-spun-dark text-white text-[13px] font-medium px-4 py-2 rounded-md transition"
          >
            Get started
          </Link>
        </div>
        <div className="h-px bg-ruler" />
      </div>
    </nav>
  );
}
