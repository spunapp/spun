type ToolDefinition = {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "onboard_business",
    description:
      "Create the user's business profile from information gathered through conversation. Call this once you have their business name, description, what they sell, industry, target audience, and at least one location.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Business name" },
        description: {
          type: "string",
          description: "Business description",
        },
        productOrService: {
          type: "string",
          enum: ["product", "service", "both"],
          description: "Type of offering",
        },
        whatTheySell: {
          type: "string",
          description: "Description of what they sell",
        },
        industry: { type: "string", description: "Business industry" },
        targetAudience: {
          type: "string",
          description: "Target audience description",
        },
        demographics: {
          type: "object",
          description: "Demographics info if provided",
          properties: {
            gender: { type: "string" },
            ageRange: { type: "string" },
            incomeRange: { type: "string" },
            locationType: { type: "string" },
          },
        },
        locations: {
          type: "array",
          items: { type: "string" },
          description: "Operating locations",
        },
        competitors: {
          type: "array",
          items: { type: "string" },
          description: "Main competitors",
        },
      },
      required: [
        "name",
        "description",
        "productOrService",
        "whatTheySell",
        "industry",
        "targetAudience",
        "locations",
      ],
    },
  },
  {
    name: "generate_campaign",
    description:
      "Generate a full marketing campaign plan including audience breakdown, channel recommendations, budget allocation, and full-funnel strategy (TOF/MOF/BOF).",
    input_schema: {
      type: "object" as const,
      properties: {
        phase: {
          type: "number",
          description: "Campaign phase (1=initial, 2=optimise, 3=scale)",
        },
        channels: {
          type: "array",
          items: { type: "string" },
          description: "Restrict the campaign to ONLY these ad platforms. Use platform keys: meta, google, linkedin, tiktok. Always pass this based on what the user has asked for or what you know they want.",
        },
      },
    },
  },
  {
    name: "generate_creatives",
    description:
      "Generate 3 ad creative variants for a specific funnel stage of a campaign. Call this to create new creatives OR to regenerate them with different instructions (e.g. different tone, different imagery style). Always call this tool rather than describing what you would do.",
    input_schema: {
      type: "object" as const,
      properties: {
        campaignId: {
          type: "string",
          description: "ID of the campaign to generate creatives for",
        },
        funnelStage: {
          type: "string",
          enum: ["tof", "mof", "bof"],
          description: "Funnel stage: tof (awareness), mof (consideration), bof (conversion)",
        },
        customInstructions: {
          type: "string",
          description: "Optional instructions to guide the creative direction, e.g. 'use warmer colours', 'focus on time-saving benefit', 'professional corporate style'. Passed to both copy and image generation.",
        },
      },
      required: ["campaignId", "funnelStage"],
    },
  },
  {
    name: "launch_campaign",
    description:
      "Queue a campaign for launch on a connected platform. This goes through the approval queue based on the user's trust mode.",
    input_schema: {
      type: "object" as const,
      properties: {
        campaignId: {
          type: "string",
          description: "Campaign to launch",
        },
        platform: {
          type: "string",
          enum: ["meta", "google", "klaviyo", "ga4"],
          description: "Platform to launch on",
        },
        budget: {
          type: "number",
          description: "Daily budget in the user's local currency",
        },
      },
      required: ["campaignId", "platform"],
    },
  },
  {
    name: "analyze_performance",
    description:
      "Pull and analyse performance data from connected channels and active campaigns.",
    input_schema: {
      type: "object" as const,
      properties: {
        dateRange: {
          type: "string",
          enum: ["7d", "14d", "30d", "90d"],
          description: "Date range for analysis",
        },
      },
    },
  },
  {
    name: "tier_prospects",
    description:
      "Score and tier a list of prospects into Tier 1 (highest priority), Tier 2 (good opportunity), or Tier 3 (lower priority) based on company fit and buying signals.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              company: { type: "string" },
              email: { type: "string" },
            },
          },
          description: "List of prospects to tier",
        },
      },
      required: ["prospects"],
    },
  },
  {
    name: "generate_sales_strategy",
    description:
      "Generate a personalized sales outreach strategy for a specific prospect, including channel recommendation, initial message, follow-up sequence, and objection handling.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: {
          type: "string",
          description: "Prospect ID to generate strategy for",
        },
      },
      required: ["prospectId"],
    },
  },
  {
    name: "calculate_roi",
    description:
      "Calculate ROI metrics from marketing spend and revenue data. Returns ROI%, CAC, LTV, and summary.",
    input_schema: {
      type: "object" as const,
      properties: {
        adSpend: {
          type: "number",
          description: "Total ad spend to calculate against",
        },
      },
    },
  },
  {
    name: "connect_channel",
    description:
      "Initiate OAuth connection to an ad platform or marketing tool.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: [
            "meta",
            "google",
            "klaviyo",
            "ga4",
            "tiktok",
            "linkedin",
            "shopify",
            "buffer",
          ],
          description: "Platform to connect",
        },
      },
      required: ["platform"],
    },
  },
  {
    name: "show_meta_setup_guide",
    description:
      "Show a step-by-step guide for creating a Meta (Facebook/Instagram) ad account from scratch. Use this when the user tells you they don't yet have a Meta ad account, Business Manager, Business Portfolio, Facebook Page for their business, or needs help signing up for Meta advertising. Do NOT use this for users who already have an ad account — use connect_channel for them instead.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "show_google_ads_setup_guide",
    description:
      "Show a step-by-step guide for creating a Google Ads account from scratch. Use this when the user tells you they don't yet have a Google Ads account, need help signing up for Google PPC, or ask how to set up Google Ads. Do NOT use this for users who already have a Google Ads account — use connect_channel with platform 'google' for them instead.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "show_ga4_setup_guide",
    description:
      "Show a step-by-step guide for setting up Google Analytics 4 (GA4) from scratch. Use this when the user doesn't have GA4 set up, needs help creating a GA4 property, or asks how to set up analytics tracking for their website. Do NOT use this for users who already have GA4 — use connect_channel with platform 'ga4' for them instead.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "check_usage",
    description:
      "Check the user's current usage against their subscription tier limits (campaigns launched, creatives generated, channels connected).",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "search_web",
    description:
      "Search the web for information. Use this to research competitors, market trends, industry data, company information, pricing benchmarks, or anything else that would help build a better growth strategy. Call this proactively during onboarding when the user mentions competitors or their industry, and when building campaigns to research the market.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query. Be specific — e.g. 'top competitors to Acme in UK SaaS marketing' rather than just 'competitors'.",
        },
        searchDepth: {
          type: "string",
          enum: ["basic", "advanced"],
          description: "Use 'basic' for quick lookups, 'advanced' for deeper research. Defaults to basic.",
        },
      },
      required: ["query"],
    },
  },
]
