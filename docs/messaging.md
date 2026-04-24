# Messaging Architecture

Spun is chat-first. The messaging layer is the backbone — it handles inbound messages from all channels, routes them to the agent, and delivers replies back through the correct channel.

## Channel Architecture

```
                    ┌──────────────┐
                    │   WhatsApp   │
                    │   Business   │
                    │     API      │
                    └──────┬───────┘
                           │ webhook POST
                           ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Twilio     │──▶│   Webhook    │◀──│  Web Client  │
│   (SMS)      │   │   Handlers   │   │  (Convex     │
└──────────────┘   │              │   │   mutation)   │
                   └──────┬───────┘   └──────────────┘
                          │
                     normalize
                          │
                          ▼
                   ┌──────────────┐
                   │   Message    │
                   │   Router     │
                   └──────┬───────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │  Store   │ │ Lookup │ │ Trigger  │
        │ message  │ │ biz by │ │  agent   │
        │ in DB    │ │ phone  │ │  brain   │
        └──────────┘ └────────┘ └──────────┘
```

## Message Normalization

Every inbound message, regardless of channel, is converted to a standard format before processing:

```typescript
interface NormalizedMessage {
  channel: "whatsapp" | "sms" | "web";
  senderPhone?: string;       // E.164 for WhatsApp/SMS
  senderUserId?: string;      // Auth user ID for web
  text: string;
  externalId?: string;        // WhatsApp message ID or Twilio MessageSid
  timestamp: number;
  mediaUrls?: string[];       // Attached images (if any)
}
```

### WhatsApp → Normalized

```
webhook payload:
  entry[0].changes[0].value.messages[0]
    .from → senderPhone (already E.164)
    .text.body → text
    .id → externalId
    .timestamp → timestamp (Unix)
```

### Twilio SMS → Normalized

```
webhook payload:
  From → senderPhone (already E.164)
  Body → text
  MessageSid → externalId
  (timestamp from server receipt time)
```

### Web Chat → Normalized

```
Convex mutation called directly:
  userId → senderUserId
  content → text
  (no externalId)
  (timestamp from mutation time)
```

## Business Lookup

After normalization, the router identifies which business the message belongs to:

1. **WhatsApp/SMS:** Match `senderPhone` against `businesses.ownerPhone`
2. **Web:** Match `senderUserId` against `businesses.ownerId`

If no match found:
- WhatsApp/SMS: could be a new signup or a wrong number. Store the message, reply with onboarding prompt: "Hi! I'm Spun. Want to set up marketing for your business? Tell me about it."
- Web: must be authenticated, so this shouldn't happen (error state)

## Reply Routing

Agent replies go back through the same channel the owner used:

```typescript
async function sendReply(businessId: string, text: string, messageType: string) {
  const business = await getBusiness(businessId);
  const lastMessage = await getLastOwnerMessage(businessId);

  switch (lastMessage.channel) {
    case "whatsapp":
      await sendWhatsApp(business.ownerPhone, text);
      break;
    case "sms":
      await sendSms(business.ownerPhone, text);
      break;
    case "web":
      // stored in DB, Convex subscription pushes to client
      break;
  }
}
```

**Exception:** Proactive messages (weekly reports, review alerts) use `business.preferredChannel`. The owner sets this during onboarding or changes it via chat ("send my reports via SMS instead").

## Proactive Messaging

Spun initiates messages in these cases:

| Event | Trigger | Content |
|---|---|---|
| Weekly report | Cron: Monday 8am in business timezone | Performance summary + next week plan |
| New review | Review sync detects new review | Rating + snippet + "Want me to respond?" |
| Lead alert | New lead logged from ads/organic | Lead info + "Want me to follow up?" |
| Campaign alert | Spend anomaly or performance threshold | "Your ad spend is 2x normal — want me to pause?" |
| Approval reminder | Pending approval >24h | "Still waiting on your OK for [action]" |

**WhatsApp 24-hour window:**
- If >24h since owner's last message, use a pre-approved template
- Templates are registered with Meta and support variable substitution
- Template messages can include quick-reply buttons

**SMS proactive:**
- No windowing restriction (just send)
- Keep proactive SMS short (<160 chars when possible, avoid multi-segment)
- Include business name: "Spun for [Business]: ..."

## Approval via Chat

When the agent needs approval (trust mode = "approve"):

**Agent sends:**
```
I'd like to launch a Google Ads campaign targeting "plumber near me" keywords 
at $15/day. Estimated monthly spend: ~$450.

Reply YES to approve, NO to skip, or tell me what to change.
```

**Owner replies:**
- "YES" / "yes" / "y" / "go" / "do it" / "approved" → execute the action
- "NO" / "no" / "n" / "skip" / "don't" → reject, mark in queue
- Anything else → treat as a conversation message, re-engage about the pending approval

**Matching logic:**
- Check if there's a pending approval for this business
- If owner reply matches approval keywords → resolve the pending approval
- If multiple pending approvals → ask which one ("I have 2 things waiting — the Google Ads campaign and a social post. Which one?")

## Message Types

All messages stored with a `messageType` that determines rendering in web chat and any special handling:

| Type | Description | Used by |
|---|---|---|
| `text` | Plain text message | All channels |
| `approval_request` | Action needing owner approval | Agent → Owner |
| `report` | Weekly performance digest | Agent → Owner |
| `campaign_update` | Campaign launched/paused/performance | Agent → Owner |
| `review_alert` | New review notification | Agent → Owner |
| `lead_alert` | New lead notification | Agent → Owner |
| `status` | Status update (e.g., "Connected your Google listing") | Agent → Owner |

In WhatsApp/SMS, all types render as text. In web chat, types get rich card rendering.

## Rate Limiting

**Outbound limits per business:**
- Max 50 agent messages/day (prevents runaway loops)
- Max 10 proactive messages/day (prevents spam feeling)
- Max 5 approval requests/day (prevents decision fatigue)

**Global limits:**
- WhatsApp: stay within Meta's tier limits (start at 250 unique recipients/24h)
- SMS: 1 message/second per Twilio number (queue if bursting)

## Conversation State Machine

Each conversation has an implicit state based on business onboarding and pending actions:

```
NEW → ONBOARDING → ACTIVE
                      ↕
              WAITING_FOR_APPROVAL
```

- **NEW:** First message received, no business record yet
- **ONBOARDING:** Business record exists, `onboardingState` not "active"
- **ACTIVE:** Business fully set up, agent operating normally
- **WAITING_FOR_APPROVAL:** One or more pending approvals, agent prioritizes resolving them

The agent's system prompt receives the current state so it knows what to focus on.
