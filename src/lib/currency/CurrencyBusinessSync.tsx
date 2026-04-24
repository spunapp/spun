"use client"

import { useEffect } from "react"
import { useQuery } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "../../../convex/_generated/api"
import { useCurrency } from "./context"
import { isSupportedCurrency } from "./currencies"

/**
 * Keeps the CurrencyProvider's currency in sync with the authenticated user's
 * saved preference (`business.currency` in Convex). When present, the user's
 * explicit preference always wins over the geo-detected default.
 */
export function CurrencyBusinessSync() {
  const { user, isLoaded } = useUser()
  const userId = user?.id ?? null
  const business = useQuery(
    api.businesses.getByUser,
    isLoaded && userId ? { userId } : "skip"
  )
  const { currency, setCurrency } = useCurrency()

  useEffect(() => {
    const saved = business?.currency
    if (isSupportedCurrency(saved) && saved !== currency) {
      setCurrency(saved)
    }
  }, [business?.currency, currency, setCurrency])

  return null
}
