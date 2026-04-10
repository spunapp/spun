import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  const subscription = await convex.query(api.subscriptions.getByUser, { userId })
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 })
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://spun.bot"

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
