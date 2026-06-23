import NextAuth from 'next-auth'
import Twitter from 'next-auth/providers/twitter'
import { createClient } from '@supabase/supabase-js'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    xUserId: string
    xAccountDbId: string
    username: string
  }
}

// JWT shape carried through callbacks (augmenting 'next-auth/jwt' is unreliable
// under bundler module resolution, so we cast the token locally instead).
interface AppJWT {
  accessToken?: string
  refreshToken?: string
  xUserId?: string
  xAccountDbId?: string
  username?: string
  name?: string | null
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'twitter' || !account.access_token) return true

      const xUserId = account.providerAccountId
      const username = (profile as Record<string, any>)?.data?.username ?? user.name ?? ''
      const displayName = user.name ?? ''
      const now = new Date().toISOString()
      const supabase = getSupabaseAdmin()

      // Upsert the x_account row
      const { data: existing } = await supabase
        .from('x_accounts')
        .select('id')
        .eq('x_user_id', xUserId)
        .single()

      if (existing) {
        await supabase
          .from('x_accounts')
          .update({
            username,
            display_name: displayName,
            access_token: account.access_token,
            refresh_token: account.refresh_token ?? null,
            is_active: true,
            updated_at: now,
          })
          .eq('x_user_id', xUserId)
      } else {
        await supabase.from('x_accounts').insert({
          id: crypto.randomUUID(),
          x_user_id: xUserId,
          username,
          display_name: displayName,
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? null,
          is_active: true,
          created_at: now,
          updated_at: now,
        })
      }

      return true
    },

    async jwt({ token, account, profile }) {
      const t = token as AppJWT
      if (account) {
        t.accessToken = account.access_token
        t.refreshToken = account.refresh_token
        t.xUserId = account.providerAccountId
        t.username = (profile as Record<string, any>)?.data?.username ?? t.name ?? ''
      }

      // Resolve the internal Supabase row ID once and cache in JWT
      if (t.xUserId && !t.xAccountDbId) {
        const supabase = getSupabaseAdmin()
        const { data } = await supabase
          .from('x_accounts')
          .select('id')
          .eq('x_user_id', t.xUserId)
          .single()
        if (data) t.xAccountDbId = data.id
      }

      return token
    },

    async session({ session, token }) {
      const t = token as AppJWT
      session.accessToken = t.accessToken ?? ''
      session.xUserId = t.xUserId ?? ''
      session.xAccountDbId = t.xAccountDbId ?? ''
      session.username = t.username ?? ''
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
