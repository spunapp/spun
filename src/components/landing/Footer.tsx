"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon-192.png" alt="Spun" width={20} height={20} />
              <span className="font-mono font-medium text-sm text-gray-900 tracking-tight">spun</span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-gray-400">
              <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-600 transition">Terms</Link>
              <Link href="/cookies" className="hover:text-gray-600 transition">Cookies</Link>
              <Link href="/dpa" className="hover:text-gray-600 transition">DPA</Link>
              <button
                type="button"
                onClick={() => window.openCookieSettings?.()}
                className="hover:text-gray-600 transition"
              >
                Cookie settings
              </button>
            </div>

            <p className="text-[12px] text-gray-400">
              &copy; {new Date().getFullYear()} Spun App Ltd.
            </p>
          </div>

          <p className="mt-6 text-[11px] text-gray-400 text-center leading-relaxed">
            Registered in England and Wales, company no. 17136483. 53 Langley
            Crescent, Brighton, BN2 6NL, United Kingdom.
          </p>
        </div>
      </div>
    </footer>
  );
}
