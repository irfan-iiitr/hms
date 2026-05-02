import { NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'
import { validateSession } from '@/lib/session'

export async function POST(req: Request) {
  try {
    // Validate incoming session from Authorization header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const user = await validateSession(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
    const apiSecret = process.env.STREAM_SECRET_KEY
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Stream keys not configured' }, { status: 500 })
    }

    // Server-side token creation - do NOT expose the secret to the client
    const serverClient = new StreamChat(apiKey, apiSecret)
    const tokenForStream = serverClient.createToken(user.id)

    return NextResponse.json({ token: tokenForStream })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
