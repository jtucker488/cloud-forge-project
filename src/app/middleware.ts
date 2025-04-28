// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function middleware(request: NextRequest) {
  // Only run on API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '').trim()
  // Validate the JWT with Supabase
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Attach user id to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', data.user.id)

  // Forward the request with the new header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Only match API routes
export const config = {
  matcher: ['/api/:path*'],
}