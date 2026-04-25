"use client";

import { useEffect, useState, useRef } from "react";
import {
  Wrench,
  SmilePlus,
  Scissors,
  Dumbbell,
  UtensilsCrossed,
  Zap,
  SprayCan,
  Car,
  PawPrint,
  Camera,
  Scale,
  Home,
  IceCreamCone,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Business {
  Icon: LucideIcon;
  label: string;
}

const PINNED: Set<string> = new Set(["Dentists", "Restaurants", "Salons"]);

const initialVisible: Business[] = [
  { Icon: SmilePlus, label: "Dentists" },
  { Icon: Wrench, label: "Plumbers" },
  { Icon: Scissors, label: "Salons" },
  { Icon: Dumbbell, label: "Gyms" },
  { Icon: Zap, label: "Electricians" },
  { Icon: UtensilsCrossed, label: "Restaurants" },
  { Icon: SprayCan, label: "Cleaning" },
  { Icon: Car, label: "Mechanics" },
];

const initialPool: Business[] = [
  { Icon: PawPrint, label: "Vets" },
  { Icon: Camera, label: "Studios" },
  { Icon: Scale, label: "Law firms" },
  { Icon: Home, label: "Estate agents" },
  { Icon: IceCreamCone, label: "Ice cream shops" },
  { Icon: Store, label: "Corner shops" },
];

const VISIBLE = 8;

export function BusinessTypes() {
  const [visible, setVisible] = useState(initialVisible);
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const poolRef = useRef([...initialPool]);

  useEffect(() => {
    const rotatableSlots = Array.from({ length: VISIBLE }, (_, i) => i).filter(
      (i) => !PINNED.has(initialVisible[i].label)
    );

    const interval = setInterval(() => {
      const pool = poolRef.current;
      if (pool.length === 0) return;

      const slotIdx =
        rotatableSlots[Math.floor(Math.random() * rotatableSlots.length)];
      setSwappingIdx(slotIdx);

      setTimeout(() => {
        setVisible((prev) => {
          const next = [...prev];
          const incoming = pool.shift()!;
          pool.push(next[slotIdx]);
          next[slotIdx] = incoming;
          return next;
        });
        setTimeout(() => setSwappingIdx(null), 50);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-surface">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-24">
          <p className="text-center text-sm text-gray-600 uppercase tracking-[0.15em] mb-12">
            Built for local businesses
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-grid border border-grid">
              {visible.map(({ Icon, label }, i) => (
                <div
                  key={`slot-${i}`}
                  className="bg-white flex flex-col items-center justify-center gap-3 py-8 px-4 overflow-hidden"
                >
                  <div
                    className={`flex flex-col items-center gap-3 transition-all duration-300 ${
                      swappingIdx === i
                        ? "opacity-0 scale-90"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <Icon size={28} className="text-spun" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium text-gray-700">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
