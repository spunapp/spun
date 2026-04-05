import { NextResponse } from "next/server"
import Stripe from "stripe"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import { getTierByPriceId } from "@/lib/billing/tiers"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  })
}

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  const convex = getConvex()

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

      const subResponse = await stripe.subscriptions.retrieve(
        session.subscription as string
      )
      // Stripe v22 Response<T> extends T — cast to access subscription fields
      const subscription = subResponse as unknown as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const tier = getTierByPriceId(priceId ?? "")

      if (tier) {
        const subAny = subscription as unknown as Record<string, unknown>
        const periodEnd = subAny.current_period_end as number | undefined
        const cancelAtEnd = subAny.cancel_at_period_end as boolean | undefined

        // Check if subscription already exists for this user
        const existing = await convex.query(api.subscriptions.getByUser, { userId })
        if (existing) {
          await convex.mutation(api.subscriptions.update, {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            tier,
            status: mapStatus(subscription.status),
            currentPeriodEnd: (periodEnd ?? 0) * 1000,
            cancelAtPeriodEnd: cancelAtEnd ?? false,
          })
        } else {
          const business = await convex.query(api.businesses.getByUser, { userId })

          await convex.mutation(api.subscriptions.create, {
            userId,
            businessId: business?._id,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            tier,
            status: mapStatus(subscription.status),
            currentPeriodEnd: (periodEnd ?? 0) * 1000,
            cancelAtPeriodEnd: cancelAtEnd ?? false,
          })
        }
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as Record<string, unknown>
      const items = sub.items as { data: { price: { id: string } }[] }
      const priceId = items?.data?.[0]?.price.id
      const tier = getTierByPriceId(priceId ?? "")

      await convex.mutation(api.subscriptions.update, {
        stripeSubscriptionId: sub.id as string,
        ...(priceId ? { stripePriceId: priceId } : {}),
        ...(tier ? { tier } : {}),
        status: mapStatus(sub.status as string),
        currentPeriodEnd: ((sub.current_period_end as number) ?? 0) * 1000,
        cancelAtPeriodEnd: (sub.cancel_at_period_end as boolean) ?? false,
      })
      break
    }

    case "customer.subscription.deleted": {
      const deletedSub = event.data.object as unknown as Record<string, unknown>
      await convex.mutation(api.subscriptions.update, {
        stripeSubscriptionId: deletedSub.id as string,
        status: "canceled",
        cancelAtPeriodEnd: false,
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as Record<string, unknown>
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
