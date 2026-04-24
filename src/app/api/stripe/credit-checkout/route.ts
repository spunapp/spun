import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getCreditPackPriceId } from "@/lib/billing/tiers"
import { CURRENCY_COOKIE, normaliseCurrency } from "@/lib/currency/currencies"

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

  const body = await request.json().catch(() => ({}))
  const { businessId, currency: bodyCurrency } = body as { businessId?: string; currency?: string }
  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
  }

  const cookieCurrency = (await cookies()).get(CURRENCY_COOKIE)?.value
  const currency = normaliseCurrency(bodyCurrency ?? cookieCurrency)
  const priceId = getCreditPackPriceId(currency)

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://spun.bot"

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?credits=success`,
    cancel_url: `${origin}/settings?credits=canceled`,
    client_reference_id: userId,
    metadata: { type: "credit_pack", userId, businessId, currency },
  })

  return NextResponse.json({ url: session.url })
}
