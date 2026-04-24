// Currency catalogue, country→currency map, and static FX rates.
//
// GBP is the base currency for all prices stored in the codebase (e.g.
// tiers.ts stores prices in GBP pence). For display in other currencies we
// convert on the fly using the static FX_RATES table below.
//
// FX rates are hardcoded approximations (quoted vs GBP, i.e. "1 GBP = N X").
// They are NOT live. Update them periodically or swap `convertFromGBP` for a
// call to an FX API if you want live rates.

export const BASE_CURRENCY = "GBP" as const
export const CURRENCY_COOKIE = "spun_currency" as const

export interface CurrencyInfo {
  code: string
  label: string
  locale: string // Intl locale to use when formatting
  // Stripe zero-decimal currencies round to whole units (see
  // https://docs.stripe.com/currencies#zero-decimal). We mirror that so we
  // display e.g. JPY as "¥2,500" not "¥2,500.00".
  zeroDecimal?: boolean
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  GBP: { code: "GBP", label: "GBP — British Pound", locale: "en-GB" },
  USD: { code: "USD", label: "USD — US Dollar", locale: "en-US" },
  EUR: { code: "EUR", label: "EUR — Euro", locale: "en-IE" },
  CAD: { code: "CAD", label: "CAD — Canadian Dollar", locale: "en-CA" },
  AUD: { code: "AUD", label: "AUD — Australian Dollar", locale: "en-AU" },
  NZD: { code: "NZD", label: "NZD — New Zealand Dollar", locale: "en-NZ" },
  CHF: { code: "CHF", label: "CHF — Swiss Franc", locale: "de-CH" },
  SEK: { code: "SEK", label: "SEK — Swedish Krona", locale: "sv-SE" },
  NOK: { code: "NOK", label: "NOK — Norwegian Krone", locale: "nb-NO" },
  DKK: { code: "DKK", label: "DKK — Danish Krone", locale: "da-DK" },
  PLN: { code: "PLN", label: "PLN — Polish Złoty", locale: "pl-PL" },
  CZK: { code: "CZK", label: "CZK — Czech Koruna", locale: "cs-CZ" },
  HUF: { code: "HUF", label: "HUF — Hungarian Forint", locale: "hu-HU" },
  RON: { code: "RON", label: "RON — Romanian Leu", locale: "ro-RO" },
  BGN: { code: "BGN", label: "BGN — Bulgarian Lev", locale: "bg-BG" },
  TRY: { code: "TRY", label: "TRY — Turkish Lira", locale: "tr-TR" },
  ILS: { code: "ILS", label: "ILS — Israeli Shekel", locale: "he-IL" },
  AED: { code: "AED", label: "AED — UAE Dirham", locale: "en-AE" },
  SAR: { code: "SAR", label: "SAR — Saudi Riyal", locale: "en-SA" },
  QAR: { code: "QAR", label: "QAR — Qatari Riyal", locale: "en-QA" },
  KWD: { code: "KWD", label: "KWD — Kuwaiti Dinar", locale: "en-KW" },
  ZAR: { code: "ZAR", label: "ZAR — South African Rand", locale: "en-ZA" },
  NGN: { code: "NGN", label: "NGN — Nigerian Naira", locale: "en-NG" },
  KES: { code: "KES", label: "KES — Kenyan Shilling", locale: "en-KE" },
  EGP: { code: "EGP", label: "EGP — Egyptian Pound", locale: "en-EG" },
  INR: { code: "INR", label: "INR — Indian Rupee", locale: "en-IN" },
  PKR: { code: "PKR", label: "PKR — Pakistani Rupee", locale: "en-PK" },
  BDT: { code: "BDT", label: "BDT — Bangladeshi Taka", locale: "en-BD" },
  LKR: { code: "LKR", label: "LKR — Sri Lankan Rupee", locale: "en-LK" },
  SGD: { code: "SGD", label: "SGD — Singapore Dollar", locale: "en-SG" },
  HKD: { code: "HKD", label: "HKD — Hong Kong Dollar", locale: "en-HK" },
  MYR: { code: "MYR", label: "MYR — Malaysian Ringgit", locale: "ms-MY" },
  IDR: { code: "IDR", label: "IDR — Indonesian Rupiah", locale: "id-ID" },
  PHP: { code: "PHP", label: "PHP — Philippine Peso", locale: "en-PH" },
  THB: { code: "THB", label: "THB — Thai Baht", locale: "th-TH" },
  VND: { code: "VND", label: "VND — Vietnamese Dong", locale: "vi-VN", zeroDecimal: true },
  JPY: { code: "JPY", label: "JPY — Japanese Yen", locale: "ja-JP", zeroDecimal: true },
  KRW: { code: "KRW", label: "KRW — South Korean Won", locale: "ko-KR", zeroDecimal: true },
  CNY: { code: "CNY", label: "CNY — Chinese Yuan", locale: "zh-CN" },
  TWD: { code: "TWD", label: "TWD — New Taiwan Dollar", locale: "zh-TW" },
  MXN: { code: "MXN", label: "MXN — Mexican Peso", locale: "es-MX" },
  BRL: { code: "BRL", label: "BRL — Brazilian Real", locale: "pt-BR" },
  ARS: { code: "ARS", label: "ARS — Argentine Peso", locale: "es-AR" },
  CLP: { code: "CLP", label: "CLP — Chilean Peso", locale: "es-CL", zeroDecimal: true },
  COP: { code: "COP", label: "COP — Colombian Peso", locale: "es-CO" },
  PEN: { code: "PEN", label: "PEN — Peruvian Sol", locale: "es-PE" },
}

// 1 GBP = X of target currency. Approximate rates; update periodically.
// Last reviewed 2026-04.
export const FX_RATES: Record<string, number> = {
  GBP: 1.0,
  USD: 1.27,
  EUR: 1.17,
  CAD: 1.73,
  AUD: 1.93,
  NZD: 2.07,
  CHF: 1.10,
  SEK: 13.5,
  NOK: 13.2,
  DKK: 8.7,
  PLN: 5.05,
  CZK: 29.0,
  HUF: 448,
  RON: 5.8,
  BGN: 2.29,
  TRY: 42.0,
  ILS: 4.72,
  AED: 4.66,
  SAR: 4.76,
  QAR: 4.62,
  KWD: 0.39,
  ZAR: 23.5,
  NGN: 1950,
  KES: 164,
  EGP: 62,
  INR: 107,
  PKR: 355,
  BDT: 152,
  LKR: 383,
  SGD: 1.67,
  HKD: 9.85,
  MYR: 5.69,
  IDR: 20500,
  PHP: 72,
  THB: 44.5,
  VND: 32100,
  JPY: 195,
  KRW: 1680,
  CNY: 9.15,
  TWD: 40.8,
  MXN: 22.0,
  BRL: 6.35,
  ARS: 1230,
  CLP: 1240,
  COP: 5100,
  PEN: 4.77,
}

// ISO 3166-1 alpha-2 country code → primary ISO 4217 currency.
// Only lists countries mapped to supported currencies above. Unknown
// countries fall back to BASE_CURRENCY.
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: "GBP", IM: "GBP", JE: "GBP", GG: "GBP",
  US: "USD", PR: "USD", VI: "USD", GU: "USD", AS: "USD", EC: "USD", SV: "USD", PA: "USD", TL: "USD", ZW: "USD",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  CH: "CHF", LI: "CHF",
  SE: "SEK",
  NO: "NOK", SJ: "NOK", BV: "NOK",
  DK: "DKK", FO: "DKK", GL: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  TR: "TRY",
  IL: "ILS",
  AE: "AED",
  SA: "SAR",
  QA: "QAR",
  KW: "KWD",
  ZA: "ZAR", LS: "ZAR", NA: "ZAR", SZ: "ZAR",
  NG: "NGN",
  KE: "KES",
  EG: "EGP",
  IN: "INR", BT: "INR",
  PK: "PKR",
  BD: "BDT",
  LK: "LKR",
  SG: "SGD",
  HK: "HKD",
  MY: "MYR",
  ID: "IDR",
  PH: "PHP",
  TH: "THB",
  VN: "VND",
  JP: "JPY",
  KR: "KRW",
  CN: "CNY",
  TW: "TWD",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  // Eurozone
  AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR", FI: "EUR",
  FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR",
  LV: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR",
  AD: "EUR", MC: "EUR", ME: "EUR", SM: "EUR", VA: "EUR", XK: "EUR",
}

export function isSupportedCurrency(code: string | null | undefined): code is string {
  return !!code && Object.prototype.hasOwnProperty.call(CURRENCIES, code)
}

export function normaliseCurrency(code: string | null | undefined): string {
  if (!code) return BASE_CURRENCY
  const upper = code.toUpperCase()
  return isSupportedCurrency(upper) ? upper : BASE_CURRENCY
}

export function currencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return BASE_CURRENCY
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? BASE_CURRENCY
}

export function convertFromGBP(amountInGBP: number, currency: string): number {
  const rate = FX_RATES[currency] ?? 1
  return amountInGBP * rate
}

export function convertFromGBPPence(amountInPence: number, currency: string): number {
  return convertFromGBP(amountInPence / 100, currency)
}

interface FormatOptions {
  // Drop the fraction part (e.g. "£70" vs "£69.99"). Useful for big headline numbers.
  whole?: boolean
  // Show the fraction even for zero-decimal currencies (rare — defaults false).
  forceDecimals?: boolean
}

export function formatCurrency(
  amount: number,
  currency: string,
  opts: FormatOptions = {}
): string {
  const info = CURRENCIES[currency] ?? CURRENCIES[BASE_CURRENCY]
  const zeroDecimal = info.zeroDecimal && !opts.forceDecimals
  const fractionDigits = opts.whole || zeroDecimal ? 0 : 2
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount)
  } catch {
    // Fallback in exotic environments where Intl may not support the currency
    const symbol = info.code
    return `${symbol} ${amount.toFixed(fractionDigits)}`
  }
}

export function formatFromGBP(
  amountInGBP: number,
  currency: string,
  opts?: FormatOptions
): string {
  return formatCurrency(convertFromGBP(amountInGBP, currency), currency, opts)
}

export function formatFromGBPPence(
  amountInPence: number,
  currency: string,
  opts?: FormatOptions
): string {
  return formatCurrency(convertFromGBPPence(amountInPence, currency), currency, opts)
}
