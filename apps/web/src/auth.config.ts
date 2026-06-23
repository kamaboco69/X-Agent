import type { NextAuthConfig } from 'next-auth'

// Edge runtime（middleware）でも安全に使える最小設定。
// Supabase / Node.js 専用APIはここに置かない。
export const authConfig = {
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig
