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

        <SignIn routing="path" path="/login" />

        <div className="text-sm text-slate-400 space-y-1">
          <p>One chat. Full funnel.</p>
          <p>Strategy. Campaigns. Creatives. Execution. Analytics.</p>
        </div>
      </div>
    </div>
  )
}
