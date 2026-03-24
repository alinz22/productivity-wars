import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: session, error } = await supabase
    .from('sessions')
    .select('invite_code')
    .eq('id', id)
    .single()

  if (error || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  return NextResponse.json({ invite_code: session.invite_code })
}
