// Auth provider interface — will be implemented with keypass.id
// Stubbed until API access is provided

export interface AuthUser {
  id: string
  email?: string
  name?: string
}

export interface AuthProvider {
  login(): Promise<AuthUser>
  logout(): Promise<void>
  getUser(): Promise<AuthUser | null>
  isAuthenticated(): Promise<boolean>
}

// Stub implementation for development
export class StubAuthProvider implements AuthProvider {
  private user: AuthUser | null = null

  async login(): Promise<AuthUser> {
    // In development, create a stub user
    this.user = {
      id: "dev-user-1",
      email: "founder@example.com",
      name: "Dev Founder",
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("spun_user", JSON.stringify(this.user))
    }
    return this.user
  }

  async logout(): Promise<void> {
    this.user = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("spun_user")
    }
  }

  async getUser(): Promise<AuthUser | null> {
    if (this.user) return this.user
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("spun_user")
      if (stored) {
        this.user = JSON.parse(stored)
        return this.user
      }
    }
    return null
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser()
    return user !== null
  }
}

// Export singleton — will be replaced with keypass.id provider
export const auth = new StubAuthProvider()
