import type { PlatformType, OAuthTokens } from "./types"
import { MetaIntegration } from "./meta"
import { GoogleAdsIntegration } from "./google"
import { KlaviyoIntegration } from "./klaviyo"
import { GA4Integration } from "./ga4"
import type { IntegrationPlugin } from "./types"

// Token management — handles refresh, encryption, and error reporting

const plugins: Record<string, () => IntegrationPlugin> = {
  meta: () => new MetaIntegration(),
  google: () => new GoogleAdsIntegration(),
  klaviyo: () => new KlaviyoIntegration(),
  ga4: () => new GA4Integration(),
}

export function getPlugin(platform: PlatformType): IntegrationPlugin {
  const factory = plugins[platform]
  if (!factory) throw new Error(`Unknown platform: ${platform}`)
  return factory()
}

export function getAuthUrl(
  platform: PlatformType,
  redirectUri: string
): string {
  const plugin = getPlugin(platform)
  return plugin.getAuthUrl(redirectUri)
}

export async function handleOAuthCallback(
  platform: PlatformType,
  code: string
): Promise<OAuthTokens> {
  const plugin = getPlugin(platform)
  return plugin.handleCallback(code)
}

export async function refreshTokenIfNeeded(
  platform: PlatformType,
  tokens: OAuthTokens
): Promise<OAuthTokens | null> {
  // Check if token is expiring in the next 5 minutes
  if (tokens.expiresAt && tokens.expiresAt > Date.now() + 5 * 60 * 1000) {
    return null // Token is still valid
  }

  if (!tokens.refreshToken) {
    return null // No refresh token available
  }

  const plugin = getPlugin(platform)
  return plugin.refreshToken(tokens.refreshToken)
}
