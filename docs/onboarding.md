# Onboarding

Onboarding is conversational. No forms, no 10-step wizard. The owner talks to Spun like a person and Spun collects what it needs through natural dialogue.

## Entry Points

1. **Web signup:** Owner visits spun.app, enters phone number → receives WhatsApp message from Spun
2. **Direct WhatsApp:** Owner texts Spun's WhatsApp number directly (from a referral, ad, etc.)
3. **Direct SMS:** Owner texts Spun's Twilio number

All three converge into the same flow.

## Conversation Flow

### Step 1: Introduction

**Spun:**
```
Hey! I'm Spun — I help local businesses get more customers. 
I handle your Google listing, ads, reviews, and social media.

What's your business called and what do you do?
```

**What we're collecting:** `businesses.name`, `businesses.description`, `businesses.industry`

The agent infers `industry` from the description. If ambiguous, it asks: "Is that more of a [X] or [Y] type business?"

### Step 2: Location

**Spun:**
```
Got it. Where are you located? Full address is ideal — 
I'll use it to set up your Google listing and target local ads.
```

**What we're collecting:** `businesses.address` (street, city, state, zip)

Also sets `businesses.timezone` based on state/zip.

### Step 3: Current Online Presence

**Spun:**
```
Quick check — do you have any of these set up already?
- Google Business Profile (the listing that shows up on Google Maps)
- A website
- Facebook or Instagram page
- Running any ads?

Just tell me what you've got and I'll work with it.
```

**What we're collecting:** Which platforms exist, so the agent knows what to audit vs. create from scratch.

### Step 4: Audit

The agent silently (or with a brief "Let me take a look...") audits what it can:

- **Google Business Profile:** Search by business name + address. If found, note completeness (missing hours? no photos? wrong categories?). If not found, note that it needs to be created.
- **Website:** If provided, basic check — does it load? Is there a phone number? Call to action?
- **Reviews:** Pull Google review count and average rating.
- **Social:** If they mentioned FB/IG, check if pages exist and when last posted.

Agent stores audit results in `listings.lastAudit` and presents findings.

### Step 5: Plan Presentation

**Spun:**
```
OK here's what I found and what I'd do this week:

Your Google listing exists but it's missing hours, photos, and a business 
description. I'll fix that first — it's the easiest win.

You have 12 Google reviews (4.3 avg). I'll start sending review requests 
to recent customers to get that number up.

No ads running. Once your listing is solid (give me 2-3 days), I'll launch 
a small Google Ads campaign — $10/day targeting "[service] near [city]."

I'll also set up 3 social posts per week on your Facebook page.

Sound good? Or want me to change anything?
```

**What happens:** `businesses.onboardingState` moves to "plan_presented"

### Step 6: Approval and Go

**Owner:** "Sounds good" / "yes" / "let's go" / adjustments

If adjustments: agent incorporates them and re-presents.

If approved:
- `businesses.onboardingState` → "active"
- `businesses.trustMode` stays "approve" (default)
- Agent begins executing the plan, requesting approval for each action

**Spun:**
```
You're all set. I'll start with your Google listing today. 

I'll check in before doing anything that costs money. 
You can always text me to change something or ask questions.

Talk soon.
```

## Onboarding State Machine

```
started          → intro sent, waiting for business info
intake           → collecting business details (name, location, presence)
auditing         → running automated audit of online presence
plan_presented   → plan shown to owner, waiting for approval
active           → onboarding complete, agent operating
```

The agent checks `businesses.onboardingState` on every turn and picks up where it left off. If the owner goes quiet mid-onboarding and comes back days later, the agent re-orients: "Hey, we left off at [X]. Want to pick up there?"

## Platform Connection During Onboarding

The agent connects platforms as needed during onboarding, not all upfront:

- **Google Business Profile:** Connected in Step 4 (audit). If owner needs to grant access, agent sends OAuth link via chat.
- **Google Ads:** Connected when first campaign is proposed (not during initial onboarding — too much friction).
- **Facebook/Instagram:** Connected when first social post is proposed.

This is intentional: don't ask the owner to connect 4 platforms before they see any value. Connect one at a time, as each becomes relevant.

## Data Collected

By end of onboarding, we have:

| Field | Source |
|---|---|
| Owner phone | Entry point (WhatsApp/SMS sender) |
| Owner name | Asked or inferred |
| Business name | Conversation |
| Business description | Conversation |
| Industry | Inferred from description |
| Address | Conversation |
| Timezone | Inferred from address |
| Website | Conversation (optional) |
| Current platforms | Conversation |
| GBP listing state | Audit |
| Review count + rating | Audit |
| Trust mode | Default (approve) |
| Daily/monthly budget cap | Set during plan approval or defaulted ($15/day, $500/mo) |
| Preferred channel | Whichever channel they signed up on |

## Edge Cases

**Owner provides minimal info:**
Agent works with what it has. Doesn't block on missing fields. If business hours aren't provided, agent asks later or skips for now.

**Owner already has everything set up:**
Audit results show healthy online presence. Agent pivots to optimization: "Your listing looks solid. Let me focus on getting your review count up and running some targeted ads."

**Owner is skeptical / just browsing:**
Agent doesn't push. "No pressure — I'm here when you're ready. You can always text me later." Sets onboarding state to "started" and waits.

**Owner wants to do just one thing:**
"I just want help with reviews." Agent respects this. Sets up review collection only. Mentions other capabilities in passing ("By the way, your Google listing could use some work — let me know if you want me to look at it").

**Multiple locations:**
v1 supports one location per business. If owner mentions multiple: "Right now I work best with one location at a time. Let's start with [primary location] and we can add more later." (Pro plan will support multi-location.)
