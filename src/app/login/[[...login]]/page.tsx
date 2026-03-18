import { SignIn } from "@clerk/nextjs"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div>
          <Image
            src="/spun.gif"
            alt="Spun"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-2xl"
            unoptimized
          />
          <Image
            src="/logo.png"
            alt="Spun"
            width={200}
            height={56}
            className="mx-auto"
          />
          <p className="text-slate-300 mt-3">
            Your marketing department in a chat window.
          </p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          appearance={{
            variables: {
              colorBackground: "#1F333B",
              colorPrimary: "#5B9BAA",
              colorText: "#f8fafc",
              colorTextSecondary: "#94a3b8",
              colorInputBackground: "#273E47",
              colorInputText: "#f8fafc",
              colorNeutral: "#94a3b8",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "shadow-none border border-white/10",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton:
                "border border-white/30 bg-white/15 text-white hover:bg-white/25 transition-colors",
              socialButtonsBlockButtonText: "text-white font-medium",
              socialButtonsBlockButtonArrow: "text-white",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500",
              formFieldLabel: "text-slate-300",
              formFieldInput:
                "border border-white/10 focus:border-[#5B9BAA] focus:ring-[#5B9BAA]",
              formButtonPrimary:
                "bg-[#5B9BAA] hover:bg-[#4A8A9A] text-white transition-colors",
              footerActionLink: "text-[#5B9BAA] hover:text-[#7BB5C4] transition-colors",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-[#5B9BAA]",
              alertText: "text-slate-300",
            },
          }}
        />

        <div className="text-sm text-slate-400 space-y-1">
          <p>One chat. Full funnel.</p>
          <p>Strategy. Campaigns. Creatives. Execution. Analytics.</p>
        </div>
      </div>
    </div>
  )
}
