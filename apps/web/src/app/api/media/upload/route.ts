import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mediaCategory = (formData.get('mediaCategory') as string | null) ?? 'tweet_image'

    if (!file) return NextResponse.json({ success: false, error: 'file required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const mediaId = await client.uploadMedia(arrayBuffer, file.type, mediaCategory)
    incrementUsage(account.id, 'media_upload')

    return NextResponse.json({ success: true, data: { mediaId } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
