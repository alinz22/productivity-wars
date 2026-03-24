'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { getClassDef } from '@/lib/classes'
import type { UserProfile } from '@/lib/supabase'

export default function LobbyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) { router.push('/onboarding'); return }
          setProfile(data)
          setLoading(false)
        })
    })
  }, [router])

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/session', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/game/${data.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session')
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    const code = inviteInput.trim().toUpperCase()
    if (!code) { setError('Enter an invite code'); return }
    setJoining(true)
    setError('')
    try {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/game/${data.session_id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join session')
      setJoining(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glow-green pulse-glow" style={{ fontSize: '14px', letterSpacing: '3px' }}>LOADING...</div>
      </div>
    )
  }

  const classDef = profile ? getClassDef(profile.class) : null

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '4px', marginBottom: '14px' }}>
          INSERT COIN TO PLAY
        </div>
        <h1 className="glow-green" style={{ fontSize: 'clamp(20px, 5vw, 36px)', lineHeight: '1.5', letterSpacing: '3px' }}>
          PRODUCTIVITY
          <br />
          WARS
        </h1>
      </div>

      {/* Hero card */}
      {profile && classDef && (
        <div
          className="pixel-border fade-in"
          style={{
            background: 'var(--panel)',
            padding: '16px 20px',
            marginBottom: '24px',
            width: '100%',
            maxWidth: '460px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <span style={{ fontSize: '22px' }}>{classDef.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: classDef.color }}>{profile.username}</div>
            <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {classDef.name} · {profile.total_xp} XP ALL-TIME
            </div>
          </div>
          <button
            className="pixel-btn pixel-btn-gray"
            onClick={handleLogout}
            style={{ fontSize: '7px', padding: '6px 10px' }}
          >
            LOGOUT
          </button>
        </div>
      )}

      {/* Action panel */}
      <div
        className="pixel-border-cyan"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '460px' }}
      >
        {/* Create */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ color: 'var(--neon-cyan)', fontSize: '8px', letterSpacing: '2px', marginBottom: '12px' }}>
            START A NEW SESSION
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '7px', marginBottom: '14px', lineHeight: '2' }}>
            Create a battle arena and share the invite code with rivals.
          </div>
          <button
            className="pixel-btn pixel-btn-green"
            onClick={handleCreate}
            disabled={creating}
            style={{ width: '100%', fontSize: '10px', padding: '14px', opacity: creating ? 0.7 : 1 }}
          >
            {creating ? 'LOADING...' : '⚔ CREATE SESSION'}
          </button>
        </div>

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '28px' }}>
          <div style={{ color: 'var(--neon-magenta)', fontSize: '8px', letterSpacing: '2px', marginBottom: '12px' }}>
            JOIN WITH INVITE CODE
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="pixel-border" style={{ flex: 1 }}>
              <input
                className="pixel-input"
                placeholder="ABC123"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={6}
                style={{ letterSpacing: '4px', textAlign: 'center' }}
              />
            </div>
            <button
              className="pixel-btn pixel-btn-magenta"
              onClick={handleJoin}
              disabled={joining}
              style={{ fontSize: '8px', opacity: joining ? 0.7 : 1 }}
            >
              {joining ? '...' : 'JOIN'}
            </button>
          </div>
        </div>

        {error && (
          <div className="glow-mag" style={{ marginTop: '16px', fontSize: '8px', textAlign: 'center' }}>
            !! {error} !!
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '20px' }}>
        <a
          href="/leaderboard"
          style={{ color: 'var(--neon-yellow)', fontSize: '8px', textDecoration: 'none' }}
        >
          🏆 GLOBAL LEADERBOARD
        </a>
      </div>

      <div style={{ marginTop: '20px', color: 'var(--text-dim)', fontSize: '8px' }}>
        <span className="blink">_</span>
      </div>
    </main>
  )
}
