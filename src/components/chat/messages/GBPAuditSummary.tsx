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
      topResults?: Array<{ name?: string; websiteUri?: string }>
    }
  | { error: string }

const VERDICT_COLOURS: Record<string, string> = {
  excellent: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  good: "text-emerald-300 bg-emerald-400/5 border-emerald-400/20",
  "needs-work": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
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
        <p className="text-sm text-red-300">{audit.error}</p>
        {content && <p className="text-sm text-slate-300 whitespace-pre-wrap">{content}</p>}
      </div>
    )
  }

  if (!audit.found) {
    const hasDiagnostics =
      (audit.triedQueries && audit.triedQueries.length > 0) ||
      (audit.scrapedNames && audit.scrapedNames.length > 0) ||
      (audit.topResults && audit.topResults.length > 0)
    return (
      <div className="space-y-3">
        {content && (
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
        <div className="bg-[var(--background-dark)] border border-white/10 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center shrink-0">
              <MapPinOff className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">
                No Google Business Profile found
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                I couldn&apos;t find a Google Business Profile linked to {audit.websiteUrl}. If you
                have a physical location or serve local customers, a GBP is free, takes 15 minutes to
                set up, and drives a big chunk of local discovery.
              </p>
              {onSend && (
                <button
                  onClick={() => onSend("Help me set up a Google Business Profile")}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#5B9BAA] hover:bg-[#4d8a99] text-white transition-colors"
                >
                  Help me set one up
                </button>
              )}
              {hasDiagnostics && (
                <details className="mt-4">
                  <summary className="text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-400">
                    Debug info
                  </summary>
                  <div className="mt-2 space-y-2 text-[11px] text-slate-400">
                    {audit.scrapedNames && audit.scrapedNames.length > 0 && (
                      <div>
                        <p className="text-slate-500 mb-1">Scraped names:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {audit.scrapedNames.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {audit.triedQueries && audit.triedQueries.length > 0 && (
                      <div>
                        <p className="text-slate-500 mb-1">Search queries tried:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {audit.triedQueries.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {audit.topResults && audit.topResults.length > 0 && (
                      <div>
                        <p className="text-slate-500 mb-1">Top Places results (none matched domain):</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {audit.topResults.slice(0, 8).map((r, i) => (
                            <li key={i}>
                              {r.name ?? "(no name)"} — {r.websiteUri ?? "(no website)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
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
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{content}</p>
      )}

      {/* Header card: score + verdict + summary */}
      <div className="bg-[var(--background-dark)] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-3">
          <ScoreRing score={audit.score} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1">Auditing</p>
            <h4 className="text-sm font-semibold text-white truncate">{audit.placeName}</h4>
            <span
              className={`inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${verdictClass}`}
            >
              {VERDICT_LABEL[audit.verdict]}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{audit.summary}</p>
      </div>

      {/* Failed checks — highest priority */}
      {failed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fixes to make ({failed.length})
          </p>
          {failed.map((check) => (
            <div
              key={check.name}
              className="bg-[var(--background-dark)] border border-red-400/20 rounded-xl p-3 flex items-start gap-2.5"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-400/15 mt-0.5 shrink-0">
                <X className="w-3 h-3 text-red-400" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-white">{check.name}</p>
                  {check.value && (
                    <p className="text-xs text-slate-500 truncate">{check.value}</p>
                  )}
                </div>
                {check.recommendation && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{check.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Passed checks — compact list */}
      {passed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Already done ({passed.length})
          </p>
          <div className="bg-[var(--background-dark)] border border-white/5 rounded-xl p-3 space-y-1.5">
            {passed.map((check) => (
              <div key={check.name} className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400/15 shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </span>
                <p className="text-xs text-slate-300 flex-1">{check.name}</p>
                {check.value && (
                  <p className="text-xs text-slate-500 truncate max-w-[50%]">{check.value}</p>
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5B9BAA] hover:text-[#7ab5c4] transition-colors"
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
        <span className="text-sm font-bold text-white">{score}</span>
      </div>
    </div>
  )
}
