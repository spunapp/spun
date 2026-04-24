import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 99,
    description: "Get found on Google",
    features: [
      "Google listing management",
      "Review collection & responses",
      "Weekly reports via WhatsApp",
      "100 AI actions / month",
      "WhatsApp chat support",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Growth",
    price: 199,
    description: "Full marketing on autopilot",
    features: [
      "Everything in Starter",
      "Google Ads management",
      "Facebook & Instagram posting",
      "Lead tracking & follow-ups",
      "500 AI actions / month",
      "Priority support",
    ],
    cta: "Get started",
    featured: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-surface">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-24">
          <div className="mb-16">
            <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3">
              Pricing
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight">
              Simple pricing. No contracts.
            </h2>
            <p className="mt-3 text-gray-500 text-[15px]">
              Ad spend is separate — passed through to Google/Meta at cost.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-grid border border-grid">
            {plans.map(
              ({ name, price, description, features, cta, featured }) => (
                <div
                  key={name}
                  className={`p-8 flex flex-col ${featured ? "bg-spun-50/50" : "bg-white"}`}
                >
                  {featured && (
                    <p className="text-[10px] font-semibold text-spun uppercase tracking-[0.15em] mb-4">
                      Most popular
                    </p>
                  )}
                  <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                  <p className="text-[13px] text-gray-500 mt-1">{description}</p>

                  <div className="mt-6 mb-8">
                    <span className="text-3xl font-bold text-gray-900">${price}</span>
                    <span className="text-[13px] text-gray-400">/mo</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[13px]">
                        <Check
                          size={14}
                          className={`mt-0.5 shrink-0 ${featured ? "text-spun" : "text-gray-300"}`}
                          strokeWidth={2}
                        />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`w-full py-2.5 rounded-md font-medium text-[13px] transition text-center ${
                      featured
                        ? "bg-spun hover:bg-spun-dark text-white"
                        : "border border-grid hover:border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    {cta}
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
