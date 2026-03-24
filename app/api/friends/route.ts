import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id, status, created_at,
      requester:requester_id(id, username, class, total_xp),
      addressee:addressee_id(id, username, class, total_xp)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  // Find the target user
  const { data: target } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('username', String(username).trim().toUpperCase())
    .single()

  if (!target) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  if (target.id === user.id) return NextResponse.json({ error: "Can't add yourself" }, { status: 400 })

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Friend request already exists', existing }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: target.id, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
