"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function CTA() {
  const { isSignedIn, isLoaded } = useUser();
  const ctaHref = isLoaded && isSignedIn ? "/chat" : "/pricing";

  return (
    <section className="bg-surface">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-24">
          <div className="border border-grid bg-gray-900 rounded-md p-6 md:p-12 lg:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Your marketing should run while you take care of business.
              </h2>
              <p className="mt-4 text-gray-400 text-[15px] max-w-md">
                Set up in one conversation. First report in 7 days. Cancel
                anytime.
              </p>
            </div>
            <Link
              href={ctaHref}
              className="bg-spun hover:bg-spun-dark text-white font-medium px-8 py-3 rounded-md text-sm transition shrink-0"
            >
              Automate your business
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
