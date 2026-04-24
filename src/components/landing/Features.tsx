import {
  MapPin,
  Megaphone,
  Star,
  Share2,
  UserPlus,
  BarChart3,
} from "lucide-react";

const features = [
  {
    Icon: MapPin,
    title: "Google listing management",
    description:
      "Optimizes your Google Business Profile — hours, photos, categories, posts — so you show up when people search.",
  },
  {
    Icon: Megaphone,
    title: "Ads that run themselves",
    description:
      "Creates and manages Google Ads campaigns. Sets budget, adjusts bids, pauses underperformers, reports results.",
  },
  {
    Icon: Star,
    title: "Review collection",
    description:
      "Sends review requests to your customers via WhatsApp. Drafts and publishes responses to new reviews.",
  },
  {
    Icon: Share2,
    title: "Social media posting",
    description:
      "Generates and schedules posts for Facebook and Instagram. Keeps your pages active without you doing anything.",
  },
  {
    Icon: UserPlus,
    title: "Lead follow-ups",
    description:
      "Tracks new leads from every source. Sends follow-up messages. Moves them through a pipeline from new to booked.",
  },
  {
    Icon: BarChart3,
    title: "Weekly reports",
    description:
      "Every Monday: calls, sources, spend, results. Plain English, sent to your WhatsApp. No dashboard required.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-surface">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-24">
          <div className="mb-16">
            <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3">
              Features
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight">
              Everything a marketing team does
            </h2>
            <p className="mt-3 text-gray-500 text-[15px]">
              None of the overhead.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-grid border border-grid">
            {features.map(({ Icon, title, description }, i) => (
              <div
                key={title}
                className={`p-8 hover:bg-spun-50/50 transition ${i === 0 || i === 5 ? "bg-spun-50/40" : "bg-white"}`}
              >
                <Icon size={20} className="text-spun mb-5" strokeWidth={1.5} />
                <h3 className="text-[15px] font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
