import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

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

  const { priceId } = await request.json()
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 })
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://spun.bot"

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    // Stripe auto-converts the GBP price into the customer's local currency
    // at checkout time. Belt-and-braces: this overrides the dashboard setting
    // in case it isn't toggled on.
    adaptive_pricing: { enabled: true },
    success_url: `${origin}/chat?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    client_reference_id: userId,
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId },
    },
    metadata: { userId },
  })

  return NextResponse.json({ url: session.url })
}
