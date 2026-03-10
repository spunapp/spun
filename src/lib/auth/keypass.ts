// keypass.id integration — passkey-first auth + billing
// This file will be fully implemented once API access is provided
//
// keypass.id handles:
// 1. Passkey authentication (WebAuthn-based)
// 2. Subscription billing (Spark, Growth, Scale tiers)
// 3. User session management
//
// Expected integration flow:
// 1. User visits spun.bot → redirected to keypass.id for auth
// 2. User authenticates via passkey (biometric/security key)
// 3. keypass.id returns session token + user info + subscription tier
// 4. Spun validates token on each request
// 5. Billing managed through keypass.id portal

import type { AuthProvider, AuthUser } from "./provider"

export class KeypassProvider implements AuthProvider {
  // private apiKey: string
  // private baseUrl: string = "https://api.keypass.id"

  // constructor(apiKey: string) {
  //   this.apiKey = apiKey
  // }

  async login(): Promise<AuthUser> {
    // TODO: Implement keypass.id passkey auth flow
    // 1. Call keypass.id to initiate WebAuthn challenge
    // 2. User authenticates via passkey
    // 3. Receive session token + user data
    throw new Error("keypass.id integration not yet configured. Waiting for API access.")
  }

  async logout(): Promise<void> {
    // TODO: Invalidate session with keypass.id
    throw new Error("keypass.id integration not yet configured.")
  }

  async getUser(): Promise<AuthUser | null> {
    // TODO: Validate session token with keypass.id
    // Returns user info + subscription tier
    return null
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser()
    return user !== null
  }

  // async getSubscription(): Promise<{ tier: 'spark' | 'growth' | 'scale', status: string }> {
  //   // TODO: Fetch subscription from keypass.id
  // }
}
