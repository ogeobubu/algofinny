// lib/auth.ts - Client-side authentication utilities

interface User {
  id: string
  email: string
  name: string
  createdAt: string
  lastLogin?: string
}

interface AuthResponse {
  token: string
  user: User
  message: string
}

interface LoginData {
  email: string
  password: string
}

interface SignupData {
  email: string
  password: string
  name?: string
}

const TOKEN_KEY = 'algofinny_token'
const USER_KEY = 'algofinny_user'

// Token management
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// User data management
export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Authentication headers for API requests
export function getAuthHeaders(): HeadersInit {
  const token = getToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken()
}

// Login function
export async function login(credentials: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data: AuthResponse = await response.json()
    
    // Store token and user data
    setToken(data.token)
    setUser(data.user)
    
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Signup function
export async function signup(userData: SignupData): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }

    const data: AuthResponse = await response.json()
    
    // Store token and user data
    setToken(data.token)
    setUser(data.user)
    
    return data
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

// Logout function
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint to log the action
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    })
  } catch (error) {
    console.error('Logout API call failed:', error)
    // Don't throw error - we still want to clear local storage
  }
  
  // Clear local storage regardless of API call success
  removeToken()
}

// Verify token validity
export async function verifyToken(): Promise<User | null> {
  const token = getToken()
  if (!token) return null

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      // Token is invalid or expired
      removeToken()
      return null
    }

    const data = await response.json()
    
    // Update user data
    if (data.user) {
      setUser(data.user)
      return data.user
    }
    
    return null
  } catch (error) {
    console.error('Token verification error:', error)
    removeToken()
    return null
  }
}

// Refresh token
export async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      removeToken()
      return false
    }

    const data: AuthResponse = await response.json()
    
    setToken(data.token)
    setUser(data.user)
    
    return true
  } catch (error) {
    console.error('Token refresh error:', error)
    removeToken()
    return false
  }
}

// Auto-logout when token expires
export function setupTokenExpiration(): void {
  const token = getToken()
  if (!token) return

  try {
    // Parse JWT payload to get expiration
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiration = expirationTime - currentTime

    if (timeUntilExpiration > 0) {
      // Set timeout to auto-logout when token expires
      setTimeout(() => {
        console.log('Token expired, logging out...')
        removeToken()
        window.location.reload() // Refresh to show login page
      }, timeUntilExpiration)
    } else {
      // Token is already expired
      removeToken()
    }
  } catch (error) {
    console.error('Error setting up token expiration:', error)
  }
}

// Fetch wrapper that automatically includes auth headers and handles token expiration
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If unauthorized and we have a token, try to refresh it
  if (response.status === 401 && getToken()) {
    const refreshed = await refreshToken()
    if (refreshed) {
      // Retry the original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      })
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login'
    }
  }

  return response
}

// Hook for React components
export function useAuth() {
  const [user, setUserState] = React.useState<User | null>(getUser())
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await verifyToken()
      setUserState(currentUser)
      setLoading(false)
      
      if (currentUser) {
        setupTokenExpiration()
      }
    }

    checkAuth()
  }, [])

  const handleLogin = async (credentials: LoginData): Promise<void> => {
    const response = await login(credentials)
    setUserState(response.user)
    setupTokenExpiration()
  }

  const handleLogout = async (): Promise<void> => {
    await logout()
    setUserState(null)
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
  }
}

// Initialize auth on app start
if (typeof window !== 'undefined') {
  // Set up token expiration checking on page load
  setupTokenExpiration()
}