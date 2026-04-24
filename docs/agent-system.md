# Agent System

Spun's brain is Claude (Anthropic API) operating in tool-use mode. The agent receives conversation context, decides what to do, and invokes tools to take action. This document covers the system prompt, tool definitions, trust escalation, and context management.

## System Prompt

The system prompt defines Spun's persona, capabilities, and behavioral rules.

```
You are Spun, a marketing agent for local businesses. You manage the business owner's Google listing, ads, reviews, social media, and lead follow-ups. You communicate via WhatsApp, SMS, or web chat.

PERSONA
- You are direct, practical, and plain-spoken. No jargon.
- Talk like a helpful colleague, not a corporate assistant.
- Use "I" and "you." Keep messages short — the owner is reading on their phone between jobs.
- Be opinionated. If something is a bad idea, say so. If you'd recommend a different approach, lead with that.
- Never say "Great question!" or "I'd be happy to help!" or "As an AI..."
- Match the energy: if they send one word, reply with a sentence, not a paragraph.

RESPONSIBILITIES
1. Manage their Google Business Profile (hours, photos, posts, categories)
2. Run Google Ads and Meta ads campaigns within their budget
3. Collect and respond to reviews (Google, Yelp)
4. Create and schedule social media posts (Facebook, Instagram)
5. Track and follow up with leads
6. Generate weekly performance reports
7. Propose plans and get approval before acting (unless in auto mode)

OPERATING RULES
- Always check the business's trust mode before taking action.
- In "draft" mode: describe what you would do, don't invoke any tools.
- In "approve" mode: use request_approval for any action that costs money, publishes content, or contacts a customer. Wait for YES before executing.
- In "auto" mode: execute within guardrails. Still report what you did.
- Never exceed the daily or monthly budget cap. If a proposed action would exceed it, say so and ask the owner to increase the cap.
- When you don't know something about the business, ask. Don't guess.
- If a platform connection is missing or expired, tell the owner and help them reconnect.

ONBOARDING
When a new business first connects:
1. Introduce yourself in one sentence.
2. Ask what their business does and where they're located.
3. Ask about their current online presence (Google listing? Website? Social accounts? Running ads?)
4. Audit what you can access — check their GBP listing, reviews, any connected accounts.
5. Present a plain-language plan for the first week.
6. Ask them to approve or adjust.
Don't rush. Let them tell you in their own words. Don't present a form.

WEEKLY REPORTS
Every Monday, compile the week's metrics and send a plain-language summary:
- New calls/leads and where they came from
- New reviews and average rating
- Ad spend and cost-per-call
- Social media reach and engagement
- Google listing views and trend
- Next week's plan (with approval prompt)
Keep it under 200 words. Use numbers. No fluff.

CONTEXT
You will receive the business profile, recent messages, and current state of campaigns/listings/leads as context. Use it. Don't ask questions you can answer from context.
```

## Tool Definitions

Each tool maps to a Convex action. The agent invokes tools by name with structured arguments. The execution layer handles the actual API calls.

### Listing Tools

**audit_listing**
```json
{
  "name": "audit_listing",
  "description": "Audit the business's Google Business Profile. Returns completeness score and list of missing or improvable fields.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" }
    },
    "required": ["businessId"]
  }
}
```

**update_listing**
```json
{
  "name": "update_listing",
  "description": "Update fields on the Google Business Profile. Only include fields that are changing.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "updates": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "hours": { "type": "object" },
          "categories": { "type": "array", "items": { "type": "string" } },
          "phone": { "type": "string" },
          "website": { "type": "string" },
          "photos": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "required": ["businessId", "updates"]
  }
}
```

**create_gbp_post**
```json
{
  "name": "create_gbp_post",
  "description": "Create a post on the Google Business Profile (offer, update, or event).",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "postType": { "type": "string", "enum": ["update", "offer", "event"] },
      "content": { "type": "string" },
      "callToAction": { "type": "string" },
      "startDate": { "type": "string" },
      "endDate": { "type": "string" }
    },
    "required": ["businessId", "postType", "content"]
  }
}
```

### Ad Tools

**create_campaign**
```json
{
  "name": "create_campaign",
  "description": "Create a new ad campaign on Google Ads or Meta. Will be submitted for approval unless in auto mode.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "platform": { "type": "string", "enum": ["google_ads", "meta"] },
      "campaignType": { "type": "string", "enum": ["local_services", "search", "awareness"] },
      "name": { "type": "string" },
      "dailyBudget": { "type": "number", "description": "Daily budget in cents" },
      "keywords": { "type": "array", "items": { "type": "string" } },
      "targetRadius": { "type": "number", "description": "Radius in miles from business address" },
      "headline": { "type": "string" },
      "description": { "type": "string" }
    },
    "required": ["businessId", "platform", "campaignType", "name", "dailyBudget"]
  }
}
```

**adjust_budget**
```json
{
  "name": "adjust_budget",
  "description": "Change the daily budget of an existing campaign.",
  "input_schema": {
    "type": "object",
    "properties": {
      "campaignId": { "type": "string" },
      "newDailyBudget": { "type": "number", "description": "New daily budget in cents" }
    },
    "required": ["campaignId", "newDailyBudget"]
  }
}
```

**pause_resume_campaign**
```json
{
  "name": "pause_resume_campaign",
  "description": "Pause or resume an ad campaign.",
  "input_schema": {
    "type": "object",
    "properties": {
      "campaignId": { "type": "string" },
      "action": { "type": "string", "enum": ["pause", "resume"] }
    },
    "required": ["campaignId", "action"]
  }
}
```

**get_campaign_performance**
```json
{
  "name": "get_campaign_performance",
  "description": "Pull performance metrics for a campaign. Returns impressions, clicks, calls, conversions, spend.",
  "input_schema": {
    "type": "object",
    "properties": {
      "campaignId": { "type": "string" },
      "dateRange": { "type": "string", "enum": ["today", "last_7_days", "last_30_days", "this_month"] }
    },
    "required": ["campaignId"]
  }
}
```

### Review Tools

**send_review_request**
```json
{
  "name": "send_review_request",
  "description": "Send a review request via SMS to a customer.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "customerName": { "type": "string" },
      "customerPhone": { "type": "string", "description": "E.164 format" }
    },
    "required": ["businessId", "customerPhone"]
  }
}
```

**draft_review_response**
```json
{
  "name": "draft_review_response",
  "description": "Generate a response to a customer review. Returns draft text.",
  "input_schema": {
    "type": "object",
    "properties": {
      "reviewId": { "type": "string" }
    },
    "required": ["reviewId"]
  }
}
```

**post_review_response**
```json
{
  "name": "post_review_response",
  "description": "Publish a response to a review on the platform.",
  "input_schema": {
    "type": "object",
    "properties": {
      "reviewId": { "type": "string" },
      "responseText": { "type": "string" }
    },
    "required": ["reviewId", "responseText"]
  }
}
```

### Social Tools

**generate_post**
```json
{
  "name": "generate_post",
  "description": "Generate social media post content for the business.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "platform": { "type": "string", "enum": ["facebook", "instagram"] },
      "topic": { "type": "string", "description": "What the post should be about" },
      "tone": { "type": "string", "enum": ["professional", "casual", "promotional"] }
    },
    "required": ["businessId", "platform"]
  }
}
```

**schedule_post**
```json
{
  "name": "schedule_post",
  "description": "Schedule a post for publishing.",
  "input_schema": {
    "type": "object",
    "properties": {
      "postId": { "type": "string" },
      "scheduledFor": { "type": "string", "description": "ISO 8601 datetime" }
    },
    "required": ["postId", "scheduledFor"]
  }
}
```

**get_social_metrics**
```json
{
  "name": "get_social_metrics",
  "description": "Get engagement metrics for published posts.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "dateRange": { "type": "string", "enum": ["last_7_days", "last_30_days"] }
    },
    "required": ["businessId"]
  }
}
```

### Lead Tools

**log_lead**
```json
{
  "name": "log_lead",
  "description": "Record a new lead.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "name": { "type": "string" },
      "phone": { "type": "string" },
      "email": { "type": "string" },
      "source": { "type": "string", "enum": ["google_ads", "google_organic", "social", "referral", "website", "walk_in", "phone"] },
      "notes": { "type": "string" }
    },
    "required": ["businessId", "source"]
  }
}
```

**send_followup**
```json
{
  "name": "send_followup",
  "description": "Send a follow-up SMS or email to a lead.",
  "input_schema": {
    "type": "object",
    "properties": {
      "leadId": { "type": "string" },
      "channel": { "type": "string", "enum": ["sms", "email"] },
      "message": { "type": "string" }
    },
    "required": ["leadId", "channel", "message"]
  }
}
```

**update_lead_status**
```json
{
  "name": "update_lead_status",
  "description": "Move a lead to a new status in the pipeline.",
  "input_schema": {
    "type": "object",
    "properties": {
      "leadId": { "type": "string" },
      "status": { "type": "string", "enum": ["new", "contacted", "booked", "completed", "lost"] },
      "notes": { "type": "string" }
    },
    "required": ["leadId", "status"]
  }
}
```

**get_lead_summary**
```json
{
  "name": "get_lead_summary",
  "description": "Get an overview of the lead pipeline for a business.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" }
    },
    "required": ["businessId"]
  }
}
```

### Reporting Tools

**generate_weekly_report**
```json
{
  "name": "generate_weekly_report",
  "description": "Compile this week's metrics and generate a plain-language report.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" }
    },
    "required": ["businessId"]
  }
}
```

**send_report**
```json
{
  "name": "send_report",
  "description": "Deliver a generated report to the business owner.",
  "input_schema": {
    "type": "object",
    "properties": {
      "reportId": { "type": "string" },
      "channel": { "type": "string", "enum": ["whatsapp", "sms"] }
    },
    "required": ["reportId"]
  }
}
```

### System Tools

**get_business_context**
```json
{
  "name": "get_business_context",
  "description": "Load full business profile, connected channels, active campaigns, recent reviews, and lead pipeline. Use at start of every conversation turn.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" }
    },
    "required": ["businessId"]
  }
}
```

**request_approval**
```json
{
  "name": "request_approval",
  "description": "Queue an action for owner approval. Used in 'approve' trust mode. Sends the owner a message describing the action and asking for YES/NO.",
  "input_schema": {
    "type": "object",
    "properties": {
      "businessId": { "type": "string" },
      "actionType": { "type": "string" },
      "summary": { "type": "string", "description": "Plain-language description of what will happen" },
      "details": { "type": "object", "description": "Full action payload to execute if approved" },
      "estimatedCost": { "type": "number", "description": "Cost in cents, if applicable" }
    },
    "required": ["businessId", "actionType", "summary", "details"]
  }
}
```

## Trust Escalation Flow

```
Owner signs up
      │
      ▼
  APPROVE mode (default)
      │
      │  Agent proposes actions → queued → owner replies YES/NO
      │
      │  After 10+ approved actions with no rejections:
      │  Agent suggests: "I've been batting 1.000 — want to switch to auto mode?
      │                   I'll still stay within your budget and send weekly reports."
      │
      ▼
  AUTO mode (optional)
      │
      │  Agent executes within guardrails
      │  Owner can switch back anytime: "go back to approve mode"
      │
      │  If owner rejects a report item or says "don't do that":
      │  Agent offers to switch back: "Want me to check with you before acting again?"
      │
      ▼
  DRAFT mode (available anytime)
      │
      │  Agent only describes plans, never acts
      │  For owners who want to learn before delegating
```

## Context Management

Each agent turn receives:

1. **System prompt** (static, ~500 tokens)
2. **Business profile** (from `get_business_context`, ~200-400 tokens)
3. **Conversation history** (last 50 messages, ~2000-5000 tokens)
4. **Active state** (pending approvals, active campaigns, recent reviews, ~500-1000 tokens)

Total context per turn: ~3000-7000 tokens. Well within limits.

### Context Compaction

When conversation history exceeds 50 messages:
- Summarize older messages into a "conversation summary" stored on the conversation record
- Keep the summary + last 50 messages
- Business profile and active state always included fresh (not from history)

### Multi-turn Tool Use

When Claude invokes a tool:
1. Tool executes server-side (Convex action)
2. Tool result appended to conversation as a tool_result message
3. Claude called again with the updated context (sees tool result)
4. Claude can invoke more tools or respond to the owner
5. Max 5 tool calls per turn (prevent runaway loops)
