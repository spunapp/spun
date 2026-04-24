"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import {
  BASE_CURRENCY,
  CURRENCIES,
  CURRENCY_COOKIE,
  convertFromGBP,
  convertFromGBPPence,
  formatCurrency,
  formatFromGBP,
  formatFromGBPPence,
  isSupportedCurrency,
  normaliseCurrency,
  type CurrencyInfo,
} from "./currencies"

interface CurrencyContextValue {
  currency: string
  info: CurrencyInfo
  setCurrency: (code: string) => void
  format: (amount: number, opts?: { whole?: boolean; forceDecimals?: boolean }) => string
  formatFromGBP: (amountInGBP: number, opts?: { whole?: boolean; forceDecimals?: boolean }) => string
  formatFromGBPPence: (amountInPence: number, opts?: { whole?: boolean; forceDecimals?: boolean }) => string
  convertFromGBP: (amountInGBP: number) => number
  convertFromGBPPence: (amountInPence: number) => number
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function writeCookie(value: string) {
  if (typeof document === "undefined") return
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${CURRENCY_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

interface ProviderProps {
  initialCurrency: string
  children: React.ReactNode
}

export function CurrencyProvider({ initialCurrency, children }: ProviderProps) {
  const [currency, setCurrencyState] = useState<string>(() =>
    normaliseCurrency(initialCurrency)
  )

  const setCurrency = useCallback((code: string) => {
    if (!isSupportedCurrency(code)) return
    setCurrencyState(code)
    writeCookie(code)
  }, [])

  const value = useMemo<CurrencyContextValue>(() => {
    const info = CURRENCIES[currency] ?? CURRENCIES[BASE_CURRENCY]
    return {
      currency,
      info,
      setCurrency,
      format: (amount, opts) => formatCurrency(amount, currency, opts),
      formatFromGBP: (amount, opts) => formatFromGBP(amount, currency, opts),
      formatFromGBPPence: (amount, opts) => formatFromGBPPence(amount, currency, opts),
      convertFromGBP: (amount) => convertFromGBP(amount, currency),
      convertFromGBPPence: (amount) => convertFromGBPPence(amount, currency),
    }
  }, [currency, setCurrency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    // Fallback so components can be used in tests / Storybook without a provider.
    const info = CURRENCIES[BASE_CURRENCY]
    return {
      currency: BASE_CURRENCY,
      info,
      setCurrency: () => {},
      format: (amount, opts) => formatCurrency(amount, BASE_CURRENCY, opts),
      formatFromGBP: (amount, opts) => formatFromGBP(amount, BASE_CURRENCY, opts),
      formatFromGBPPence: (amount, opts) => formatFromGBPPence(amount, BASE_CURRENCY, opts),
      convertFromGBP: (amount) => convertFromGBP(amount, BASE_CURRENCY),
      convertFromGBPPence: (amount) => convertFromGBPPence(amount, BASE_CURRENCY),
    }
  }
  return ctx
}
