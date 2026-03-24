import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  if (!['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'status must be accepted or rejected' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', id)
    .eq('addressee_id', user.id) // only the addressee can accept/reject
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await supabase
    .from('friendships')
    .delete()
    .eq('id', id)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  return NextResponse.json({ ok: true })
}
