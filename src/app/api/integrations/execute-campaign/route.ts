import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { NextResponse } from "next/server"
import { MetaIntegration } from "@/lib/integrations/meta"
import type { CampaignConfig } from "@/lib/integrations/types"

// Executes a campaign on Meta after user approval.
// Called from the frontend when the user clicks "Approve" on an approval_request.
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 })
  }

  const body = await request.json() as {
    approvalId: string
    campaignId: string
    platform: string
    budget?: number
  }

  if (!body.approvalId || !body.campaignId || !body.platform) {
    return NextResponse.json({ error: "Missing approvalId, campaignId, or platform" }, { status: 400 })
  }

  if (body.platform !== "meta") {
    return NextResponse.json({ error: `Platform "${body.platform}" execution not yet supported` }, { status: 400 })
  }

  const convex = new ConvexHttpClient(convexUrl)

  try {
    // Fetch the approval record
    const approval = await convex.query(api.approvals.get, {
      id: body.approvalId as Id<"approvalQueue">,
    })
    if (!approval || approval.status !== "pending") {
      return NextResponse.json({ error: "Approval not found or already resolved" }, { status: 404 })
    }

    // Fetch campaign data
    const campaign = await convex.query(api.campaigns.get, {
      id: body.campaignId as Id<"campaigns">,
    })
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Fetch ad creatives for this campaign
    const creatives = await convex.query(api.adCreatives.listByCampaign, {
      campaignId: body.campaignId as Id<"campaigns">,
    })

    // Fetch connected Meta channel
    const channels = await convex.query(api.channels.listByBusiness, {
      businessId: campaign.businessId,
    })
    const metaChannel = channels.find((ch: { platform: string }) => ch.platform === "meta")
    if (!metaChannel) {
      return NextResponse.json({ error: "Meta not connected. Connect it in Settings first." }, { status: 400 })
    }

    // Build campaign config from Spun data
    const dailyBudget = body.budget ?? campaign.budgetBreakdown?.dailyBudget ?? 20
    const config: CampaignConfig = {
      name: campaign.theme,
      objective: campaign.funnel?.tof?.objective ?? "traffic",
      budget: dailyBudget,
      targeting: {},
      creatives: creatives.length > 0
        ? creatives.map((c: { headline: string; copy: string; cta: string }) => ({
            headline: c.headline,
            copy: c.copy,
            cta: c.cta,
          }))
        : [{ headline: campaign.theme, copy: campaign.theme, cta: "Learn More" }],
    }

    // Execute on Meta
    const meta = new MetaIntegration(metaChannel.oauthAccessToken)
    const result = await meta.createCampaign(config)

    // Mark approval as approved
    await convex.mutation(api.approvals.approve, {
      id: body.approvalId as Id<"approvalQueue">,
    })

    // Update campaign status to active
    await convex.mutation(api.campaigns.updateStatus, {
      id: body.campaignId as Id<"campaigns">,
      status: "active",
    })

    return NextResponse.json({
      success: true,
      metaCampaignId: result.id,
      name: result.name,
      status: result.status,
      budget: result.budget,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Execute campaign error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
