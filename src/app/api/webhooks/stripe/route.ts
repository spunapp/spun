import { NextResponse } from "next/server"
import Stripe from "stripe"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import { getTierByPriceId } from "@/lib/billing/tiers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
})

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Webhook signature verification failed:", msg)
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id ?? session.metadata?.userId
      if (!userId || !session.subscription) break

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      const priceId = subscription.items.data[0]?.price.id
      const tier = getTierByPriceId(priceId ?? "")

      if (tier) {
        // Check if subscription already exists for this user
        const existing = await convex.query(api.subscriptions.getByUser, { userId })
        if (existing) {
          await convex.mutation(api.subscriptions.update, {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            tier,
            status: mapStatus(subscription.status),
            currentPeriodEnd: subscription.current_period_end * 1000,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          })
        } else {
          // Look up businessId for this user
          const business = await convex.query(api.businesses.getByUser, { userId })

          await convex.mutation(api.subscriptions.create, {
            userId,
            businessId: business?._id,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            tier,
            status: mapStatus(subscription.status),
            currentPeriodEnd: subscription.current_period_end * 1000,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          })
        }
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const tier = getTierByPriceId(priceId ?? "")

      await convex.mutation(api.subscriptions.update, {
        stripeSubscriptionId: subscription.id,
        ...(priceId ? { stripePriceId: priceId } : {}),
        ...(tier ? { tier } : {}),
        status: mapStatus(subscription.status),
        currentPeriodEnd: subscription.current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await convex.mutation(api.subscriptions.update, {
        stripeSubscriptionId: subscription.id,
        status: "canceled",
        cancelAtPeriodEnd: false,
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await convex.mutation(api.subscriptions.update, {
          stripeSubscriptionId: invoice.subscription as string,
          status: "past_due",
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

function mapStatus(
  stripeStatus: string
): "active" | "past_due" | "canceled" | "trialing" | "incomplete" {
  switch (stripeStatus) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "trialing":
      return "trialing"
    default:
      return "incomplete"
  }
}
