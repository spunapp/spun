"use client"

import { Check, X, ExternalLink, MapPinOff } from "lucide-react"

interface GBPAuditSummaryProps {
  content: string
  metadata: Record<string, unknown>
  onSend?: (message: string) => void
}

type AuditCheck = {
  name: string
  passed: boolean
  value?: string
  recommendation?: string
}

type AuditMetadata =
  | {
      found: true
      placeId: string
      placeName: string
      googleMapsUri?: string
      score: number
      verdict: "excellent" | "good" | "needs-work" | "critical"
      checks: AuditCheck[]
      summary: string
    }
  | {
      found: false
      websiteUrl: string
      triedQueries?: string[]
      scrapedNames?: string[]
      scrapeStatus?: string
      domainDerivedNames?: string[]
      topResults?: Array<{ name?: string; websiteUri?: string }>
    }
  | { error: string }

const VERDICT_COLOURS: Record<string, string> = {
  excellent: "text-spun bg-emerald-50 border-emerald-200",
  good: "text-spun bg-emerald-50 border-emerald-200",
  "needs-work": "text-amber-600 bg-amber-50 border-amber-200",
  critical: "text-red-600 bg-red-50 border-red-200",
}

const VERDICT_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-work": "Needs work",
  critical: "Critical",
}

export function GBPAuditSummary({ content, metadata, onSend }: GBPAuditSummaryProps) {
  const audit = metadata as AuditMetadata

  if ("error" in audit) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-700">{audit.error}</p>
        {content && <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>}
      </div>
    )
  }

  if (!audit.found) {
    return (
      <div className="space-y-3">
        {content && (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
        <div className="bg-white border border-grid rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPinOff className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                No Google Business Profile found
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                I couldn&apos;t find a Google Business Profile linked to {audit.websiteUrl}. Two common
                reasons: (1) you don&apos;t have a GBP yet — it&apos;s free, takes 15 minutes, and drives a
                big chunk of local discovery; (2) you have one but it isn&apos;t verified and published
                yet, so it doesn&apos;t appear in public search results. Check{" "}
                <a
                  href="https://business.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-spun hover:text-spun-dark underline"
                >
                  business.google.com
                </a>{" "}
                to see the status of your profile.
              </p>
              {onSend && (
                <button
                  onClick={() => onSend("I don't have a Google Business Profile yet. Walk me through creating one step by step.")}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-spun hover:bg-spun-dark text-white transition-colors"
                >
                  Help me set one up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const passed = audit.checks.filter((c) => c.passed)
  const failed = audit.checks.filter((c) => !c.passed)
  const verdictClass = VERDICT_COLOURS[audit.verdict] ?? VERDICT_COLOURS.good

  return (
    <div className="space-y-4">
      {content && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      )}

      {/* Header card: score + verdict + summary */}
      <div className="bg-white border border-grid rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-3">
          <ScoreRing score={audit.score} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">Auditing</p>
            <h4 className="text-sm font-semibold text-gray-900 truncate">{audit.placeName}</h4>
            <span
              className={`inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${verdictClass}`}
            >
              {VERDICT_LABEL[audit.verdict]}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{audit.summary}</p>
      </div>

      {/* Failed checks — highest priority */}
      {failed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Fixes to make ({failed.length})
          </p>
          {failed.map((check) => (
            <div
              key={check.name}
              className="bg-white border border-red-200 rounded-xl p-3 flex items-start gap-2.5"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 mt-0.5 shrink-0">
                <X className="w-3 h-3 text-red-600" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-gray-900">{check.name}</p>
                  {check.value && (
                    <p className="text-xs text-gray-400 truncate">{check.value}</p>
                  )}
                </div>
                {check.recommendation && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{check.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Passed checks — compact list */}
      {passed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Already done ({passed.length})
          </p>
          <div className="bg-white border border-grid rounded-xl p-3 space-y-1.5">
            {passed.map((check) => (
              <div key={check.name} className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 shrink-0">
                  <Check className="w-2.5 h-2.5 text-spun" />
                </span>
                <p className="text-xs text-gray-600 flex-1">{check.name}</p>
                {check.value && (
                  <p className="text-xs text-gray-400 truncate max-w-[50%]">{check.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer link */}
      {audit.googleMapsUri && (
        <a
          href={audit.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-spun hover:text-spun-dark transition-colors"
        >
          View on Google Maps <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 20
  const offset = circumference - (score / 100) * circumference
  const colour = score >= 90 ? "#10b981" : score >= 70 ? "#5B9BAA" : score >= 50 ? "#f59e0b" : "#ef4444"

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg width="56" height="56" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke={colour}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900">{score}</span>
      </div>
    </div>
  )
}
