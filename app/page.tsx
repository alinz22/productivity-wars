'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [yourName, setYourName] = useState('')
  const [friends, setFriends] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addFriend = () => {
    if (friends.length < 3) setFriends([...friends, ''])
  }

  const updateFriend = (i: number, val: string) => {
    const next = [...friends]
    next[i] = val
    setFriends(next)
  }

  const removeFriend = (i: number) => {
    setFriends(friends.filter((_, idx) => idx !== i))
  }

  const handleStart = async () => {
    const trimmed = yourName.trim()
    if (!trimmed) { setError('Enter your name!'); return }

    const allNames = [trimmed, ...friends.map(f => f.trim()).filter(Boolean)]
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerNames: allNames }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const myPlayer = data.players.find((p: { name: string }) => p.name === trimmed)
      localStorage.setItem('pw_session_id', data.session.id)
      localStorage.setItem('pw_player_id', myPlayer.id)
      localStorage.setItem('pw_player_name', trimmed)

      router.push(`/game/${data.session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '4px', marginBottom: '14px' }}>
          INSERT COIN TO PLAY
        </div>
        <h1
          className="glow-green"
          style={{ fontSize: 'clamp(20px, 5vw, 36px)', lineHeight: '1.5', letterSpacing: '3px' }}
        >
          PRODUCTIVITY
          <br />
          WARS
        </h1>
        <div style={{ marginTop: '16px', color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '3px' }}>
          COMPETE &nbsp;·&nbsp; GRIND &nbsp;·&nbsp; WIN
        </div>
      </div>

      {/* Form card */}
      <div
        className="pixel-border-cyan"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '460px' }}
      >
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '9px', marginBottom: '10px', letterSpacing: '2px' }}>
            YOUR NAME
          </label>
          <div className="pixel-border">
            <input
              className="pixel-input"
              placeholder="ENTER HERO NAME..."
              value={yourName}
              onChange={e => setYourName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              maxLength={16}
              autoFocus
            />
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', color: 'var(--neon-magenta)', fontSize: '9px', marginBottom: '10px', letterSpacing: '2px' }}>
            ADD RIVALS (OPTIONAL)
          </label>
          {friends.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="pixel-border" style={{ flex: 1 }}>
                <input
                  className="pixel-input"
                  placeholder={`RIVAL ${i + 1}...`}
                  value={f}
                  onChange={e => updateFriend(i, e.target.value)}
                  maxLength={16}
                />
              </div>
              <button className="pixel-btn pixel-btn-gray" onClick={() => removeFriend(i)} style={{ fontSize: '10px', padding: '8px 12px' }}>
                ✕
              </button>
            </div>
          ))}
          {friends.length < 3 && (
            <button className="pixel-btn pixel-btn-dark" onClick={addFriend} style={{ marginTop: '4px', width: '100%', fontSize: '8px' }}>
              + ADD RIVAL
            </button>
          )}
        </div>

        {error && (
          <div className="glow-mag" style={{ marginBottom: '16px', fontSize: '9px', textAlign: 'center' }}>
            !! {error} !!
          </div>
        )}

        <button
          className="pixel-btn pixel-btn-green"
          onClick={handleStart}
          disabled={loading}
          style={{ width: '100%', fontSize: '11px', padding: '14px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'LOADING...' : '▶ START QUEST'}
        </button>
      </div>

      <div style={{ marginTop: '32px', color: 'var(--text-dim)', fontSize: '8px', textAlign: 'center', lineHeight: '2.2' }}>
        NO ACCOUNT NEEDED · SESSIONS ARE TEMPORARY
        <br />
        <span className="blink">_</span>
      </div>
    </main>
  )
}
