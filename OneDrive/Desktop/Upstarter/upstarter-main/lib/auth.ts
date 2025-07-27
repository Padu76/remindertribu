import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'

// Extend NextAuth types to include id in User
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    provider?: string
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    provider?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email'
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Demo auth - accepts any email with password >= 6 chars
        if (credentials.email && credentials.password.length >= 6) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            image: null
          }
        }

        return null
      }
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('✅ SignIn callback:', { 
        email: user?.email, 
        provider: account?.provider,
        id: user?.id 
      })
      return true
    },
    
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.provider = account?.provider
        // Set token expiration to match session maxAge
        token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      }
      
      // Refresh token on each request to extend session
      if (trigger === 'update' || !token.exp) {
        token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // Reset to 30 days
        console.log('🔄 JWT refresh triggered - session extended')
      }
      
      console.log('🔑 JWT callback:', { 
        email: token.email, 
        provider: token.provider,
        userId: token.userId,
        expires: token.exp ? new Date((token.exp as number) * 1000).toISOString() : 'No expiration'
      })
      
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        ;(session as any).provider = token.provider
      }
      
      console.log('📱 Session callback:', { 
        email: session.user?.email,
        id: session.user?.id,
        provider: (session as any).provider 
      })
      
      return session
    },
    
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days - PERSISTENT SESSION
    updateAge: 0, // Update session on every request to extend expiration
  },
  
  // Security
  secret: process.env.NEXTAUTH_SECRET,
  
  // Debug only in development
  debug: process.env.NODE_ENV === 'development',
  
  // Enhanced cookie configuration for MAXIMUM persistence
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.COOKIE_DOMAIN 
          : undefined,
        maxAge: 30 * 24 * 60 * 60 // 30 days - PERSISTENT COOKIE
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.callback-url' 
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.COOKIE_DOMAIN 
          : undefined,
        maxAge: 30 * 24 * 60 * 60
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Host-next-auth.csrf-token' 
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // Extended CSRF token
      }
    },
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.pkce.code_verifier' 
        : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900 // 15 minutes (OAuth flow)
      }
    },
    state: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.state' 
        : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900 // 15 minutes (OAuth flow)
      }
    },
    nonce: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.nonce' 
        : 'next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900 // 15 minutes (OAuth flow)
      }
    }
  },
  
  // Events for debugging and session management
  events: {
    async signIn(message) {
      console.log('🎉 User signed in:', message.user.email)
    },
    async signOut(message) {
      console.log('👋 User signed out:', message.token?.email)
    },
    async createUser(message) {
      console.log('🆕 User created:', message.user.email)
    },
    async session(message) {
      // Only log in development to avoid spam
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Session accessed:', message.session.user?.email)
      }
    }
  }
}