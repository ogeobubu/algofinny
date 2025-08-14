// lib/auth.ts

const TOKEN_KEY = "algofinny_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
}

export function clearToken(): void {
  removeToken()
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// Get profile email from token (for display purposes)
export function getProfileEmail(): string | null {
  const token = getToken()
  if (!token) return null
  
  try {
    // For the mock token format used in the Next.js API routes
    const decoded = atob(token)
    const email = decoded.split('|')[0]
    return email || null
  } catch (error) {
    // For JWT tokens from the server
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email || payload.sub || null
    } catch (jwtError) {
      console.error("Error decoding token:", error, jwtError)
      return null
    }
  }
}