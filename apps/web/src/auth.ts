import NextAuth from 'next-auth'
import Twitter from 'next-auth/providers/twitter'
import { createClient } from '@supabase/supabase-js'
import { authConfig } from './auth.config'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account, profile }) {
      if (account?.provider !== 'twitter' || !account.access_token) return true

      const xUserId = account.providerAccountId
      const username = (profile as Record<string, unknown> & { data?: { username?: string } })?.data?.username ?? user.name ?? ''
      const displayName = user.name ?? ''
      const now = new Date().toISOString()
      const supabase = getSupabaseAdmin()

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
        token.username =
          (profile as Record<string, unknown> & { data?: { username?: string } })?.data?.username ??
          (token.name as string | undefined) ??
          ''
      }

      if (token.xUserId && !token.xAccountDbId) {
        const supabase = getSupabaseAdmin()
        const { data } = await supabase
          .from('x_accounts')
          .select('id')
          .eq('x_user_id', token.xUserId as string)
          .single()
        if (data) token.xAccountDbId = data.id as string
      }

      return token
    },

    async session({ session, token }) {
      session.accessToken = (token.accessToken as string) ?? ''
      session.xUserId = (token.xUserId as string) ?? ''
      session.xAccountDbId = (token.xAccountDbId as string) ?? ''
      session.username = (token.username as string) ?? ''
      return session
    },
  },
})
