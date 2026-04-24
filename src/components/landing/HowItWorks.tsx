import { MessageCircle, ScanSearch, Rocket } from "lucide-react";

const steps = [
  {
    Icon: MessageCircle,
    step: "01",
    title: "Chat with Spun",
    description:
      "Tell Spun about your business in a quick WhatsApp conversation. No forms. No onboarding calls.",
  },
  {
    Icon: ScanSearch,
    step: "02",
    title: "Spun audits your presence",
    description:
      "Spun checks your Google listing, reviews, website, and social accounts. Finds what's missing and what to fix.",
  },
  {
    Icon: Rocket,
    step: "03",
    title: "Approve and go",
    description:
      "Spun sends you a plain-English plan. Reply YES or tell it what to change. It runs from there.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface">
      <div className="mx-4 md:mx-16 lg:mx-20">
        <div className="h-px bg-ruler" />
        <div className="px-4 md:px-14 lg:px-20 py-24">
          <div className="mb-16">
            <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight">
              Up and running in one conversation
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-grid border border-grid">
            {steps.map(({ Icon, step, title, description }, i) => (
              <div key={step} className={`p-8 ${i === 1 ? "bg-spun-50" : "bg-white"}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-md border flex items-center justify-center ${i === 1 ? "border-spun/20 bg-white" : "border-grid bg-surface"}`}>
                    <Icon size={18} className="text-spun" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
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
