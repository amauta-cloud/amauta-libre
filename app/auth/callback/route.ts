import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/tablero'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const createdAt = new Date(data.user.created_at).getTime()
      const lastSignIn = new Date(data.user.last_sign_in_at ?? data.user.created_at).getTime()
      const isNewUser = lastSignIn - createdAt < 10000
      const destination = isNewUser ? `${origin}${next}?welcome=1` : `${origin}${next}`
      return NextResponse.redirect(destination)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
