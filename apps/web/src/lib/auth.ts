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

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    xUserId?: string
    xAccountDbId?: string
    username?: string
  }
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
      version: '2.0',
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
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.xUserId = account.providerAccountId
        token.username = (profile as Record<string, any>)?.data?.username ?? token.name ?? ''
      }

      // Resolve the internal Supabase row ID once and cache in JWT
      if (token.xUserId && !token.xAccountDbId) {
        const supabase = getSupabaseAdmin()
        const { data } = await supabase
          .from('x_accounts')
          .select('id')
          .eq('x_user_id', token.xUserId)
          .single()
        if (data) token.xAccountDbId = data.id
      }

      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken ?? ''
      session.xUserId = token.xUserId ?? ''
      session.xAccountDbId = token.xAccountDbId ?? ''
      session.username = token.username ?? ''
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
