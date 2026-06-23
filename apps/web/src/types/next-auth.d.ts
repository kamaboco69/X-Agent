export {}

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
