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
              colorTextSecondary: "#cbd5e1",
              colorInputBackground: "#273E47",
              colorInputText: "#f8fafc",
              colorNeutral: "#cbd5e1",
              borderRadius: "0.75rem",
            },
            elements: {
              card: {
                style: {
                  boxShadow: "none",
                  border: "1px solid rgba(255,255,255,0.12)",
                },
              },
              headerTitle: {
                style: { color: "#ffffff", fontSize: "1.125rem" },
              },
              headerSubtitle: {
                style: { color: "#cbd5e1" },
              },
              socialButtonsBlockButton: {
                style: {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "#ffffff",
                },
              },
              socialButtonsBlockButtonText: {
                style: { color: "#ffffff", fontWeight: 500 },
              },
              dividerLine: {
                style: { backgroundColor: "rgba(255,255,255,0.12)" },
              },
              dividerText: {
                style: { color: "#94a3b8" },
              },
              formFieldLabel: {
                style: { color: "#e2e8f0", fontWeight: 500 },
              },
              formFieldInput: {
                style: {
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                },
              },
              formButtonPrimary: {
                style: { backgroundColor: "#5B9BAA", color: "#ffffff" },
              },
              footerActionLink: {
                style: { color: "#5B9BAA" },
              },
              badge: {
                style: { backgroundColor: "transparent", color: "#4b5563", border: "none", opacity: 0.5 },
              },
              tagInputItem: {
                style: { backgroundColor: "transparent", color: "#4b5563" },
              },
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
