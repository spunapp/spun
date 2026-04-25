"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useCurrency } from "@/lib/currency/context";

// Demo ad-spend figure (GBP base) shown in the hero WhatsApp mockup. Rendered
// in the viewer's local currency via useCurrency below.
const DEMO_DAILY_BUDGET_GBP = 10;

function buildMessages(dailyBudget: string) {
  return [
    {
      from: "spun",
      text: "Hey Maria! I'm Spun — I help local businesses get more customers. What's your business called and what do you do?",
      delay: 800,
    },
    {
      from: "user",
      text: "Hi! I own Bright Smile Dental in Oakland. We do general dentistry and cosmetic work.",
      delay: 2400,
    },
    {
      from: "spun",
      text: "Great. I checked your Google listing — you're missing business hours, 3 photo categories, and your description is blank. You have 23 reviews at 4.6 stars. I can fix all of this today.",
      delay: 4200,
    },
    {
      from: "user",
      text: "Wow, yes please",
      delay: 6000,
    },
    {
      from: "spun",
      text: `Done. I also want to launch a Google Ads campaign targeting "dentist near me" in Oakland — ${dailyBudget}/day. And I'll send review requests to your recent patients. Sound good?`,
      delay: 7400,
    },
    {
      from: "user",
      text: "Yes do it",
      delay: 9200,
    },
    {
      from: "spun",
      text: "You're all set. I'll send you a report next Monday showing how many new patients called. Talk soon.",
      delay: 10400,
    },
  ];
}

function WhatsAppMockup() {
  const [visibleCount, setVisibleCount] = useState(0);
  const { formatFromGBP } = useCurrency();
  const messages = buildMessages(formatFromGBP(DEMO_DAILY_BUDGET_GBP, { whole: true }));

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    messages.forEach((msg, i) => {
      timeouts.push(setTimeout(() => setVisibleCount(i + 1), msg.delay));
    });
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[400px] shrink-0 lg:mb-[-200px]">
      <div className="rounded-[52px] border-[7px] border-gray-900 bg-gray-900 shadow-2xl shadow-black/15 overflow-hidden">
        <div className="bg-gray-900 flex justify-center pt-2.5 pb-0.5">
          <div className="w-20 h-[18px] bg-gray-900 rounded-b-xl" />
        </div>

        <div className="bg-[#075E54] px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
            <Image src="/icon-192.png" alt="Spun" width={22} height={22} />
          </div>
          <div>
            <p className="text-white text-[15px] font-medium leading-tight">Spun</p>
            <p className="text-green-200 text-[11px]">online</p>
          </div>
        </div>

        <div className="bg-[#ECE5DD] h-[580px] overflow-hidden px-4 py-4 flex flex-col gap-2">
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-none">
            {messages.slice(0, visibleCount).map((msg, i) => (
              <div
                key={i}
                className={`msg-animate flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] px-3 py-2 rounded-lg text-[13px] leading-[1.5] shadow-sm ${
                    msg.from === "user"
                      ? "bg-[#DCF8C6] text-gray-800"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-white rounded-full px-4 py-2 text-[12px] text-gray-400">
              Type a message
            </div>
            <div className="w-9 h-9 rounded-full bg-[#075E54] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 h-5 flex justify-center items-center">
          <div className="w-24 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { isSignedIn, isLoaded } = useUser();
  const ctaHref = isLoaded && isSignedIn ? "/chat" : "/pricing";

  return (
    <section className="relative pt-32 pb-0 bg-surface overflow-hidden">
      <div className="mx-4 md:mx-16 lg:mx-20 px-4 md:px-14 lg:px-20 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-24">
          <div className="flex-1 max-w-xl">
            <div className="pill-tracer relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-transparent bg-surface text-[13px] font-medium text-gray-500 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-spun" />
              Marketing AI Agent
            </div>

            <h1 className="text-[32px] md:text-[44px] lg:text-[52px] font-bold tracking-tight text-gray-900 leading-[1.08]">
              Automate your
              <br />
              local business
            </h1>

            <p className="mt-6 text-[16px] text-gray-500 leading-relaxed max-w-md">
              Spun is an AI agent that manages your Google listing, runs your
              ads, collects reviews, posts on social and follows up with leads
              - all while chatting with you via WhatsApp.
            </p>

            <div className="mt-10 flex items-center gap-4">
              <Link
                href={ctaHref}
                className="bg-spun hover:bg-spun-dark text-white font-medium px-7 py-3 rounded-md text-sm transition"
              >
                Get started
              </Link>
              <a
                href="#how-it-works"
                className="text-gray-500 hover:text-gray-900 font-medium px-4 py-3 text-sm transition"
              >
                How it works →
              </a>
            </div>
          </div>

          <WhatsAppMockup />
        </div>
      </div>
    </section>
  );
}
