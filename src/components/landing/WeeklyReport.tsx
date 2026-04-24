"use client"

import Image from "next/image";
import { useCurrency } from "@/lib/currency/context";

export function WeeklyReport() {
  const { formatFromGBP } = useCurrency();
  // Example figures in GBP; converted per viewer for a more relatable mockup.
  const adSpendGBP = 146;
  const perCallGBP = 18;
  const dailyBudgetGBP = 12;
  return (
    <section className="bg-spun-50/30">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3">
                Reporting
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight">
                Know exactly where your
                <br />
                customers come from
              </h2>
              <p className="mt-5 text-gray-500 text-[15px] leading-relaxed max-w-md">
                Every Monday, Spun sends a plain-language report to your
                WhatsApp. No dashboards. No jargon. Just numbers that matter.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "How many calls and where they came from",
                  "New reviews and your average rating",
                  "Ad spend and cost per customer call",
                  "What Spun plans to do next week",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-spun" />
                    <span className="text-[14px] text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-grid bg-white rounded-md p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-grid">
                <Image src="/icon-192.png" alt="Spun" width={26} height={26} />
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">
                    Weekly Report
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Monday 8:00 AM
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-[13px] text-gray-700 leading-relaxed">
                <p>Hey Maria, here&apos;s your week:</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-grid rounded-md p-3">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Calls</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">12</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">8 Google · 3 ads · 1 social</p>
                  </div>
                  <div className="border border-grid rounded-md p-3">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Reviews</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">4 new</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">avg 4.8 stars</p>
                  </div>
                  <div className="border border-grid rounded-md p-3">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Ad spend</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatFromGBP(adSpendGBP, { whole: true })}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">~{formatFromGBP(perCallGBP, { whole: true })} per call</p>
                  </div>
                  <div className="border border-grid rounded-md p-3">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Listing views</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">890</p>
                    <p className="text-[11px] text-spun mt-0.5">↑ 22%</p>
                  </div>
                </div>

                <div className="border border-grid rounded-md p-3 bg-surface">
                  <p className="text-[12px] font-medium text-gray-800 mb-2">Next week:</p>
                  <div className="space-y-1 text-[12px] text-gray-500">
                    <p>· Launch &quot;spring cleaning&quot; campaign ({formatFromGBP(dailyBudgetGBP, { whole: true })}/day)</p>
                    <p>· Post 3x on Instagram</p>
                    <p>· Follow up with 2 unbooked leads</p>
                  </div>
                </div>

                <p className="text-spun font-medium text-[12px]">
                  Reply YES to approve or tell me what to change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
