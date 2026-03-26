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
      },
    },
  },
  {
    name: "generate_creatives",
    description:
      "Generate 3 HTML/CSS ad creative variants for a specific funnel stage of a campaign.",
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
          description: "Daily budget in dollars",
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
    name: "check_usage",
    description:
      "Check the user's current usage against their subscription tier limits (campaigns launched, creatives generated, channels connected).",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
]
