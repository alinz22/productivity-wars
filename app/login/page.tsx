'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Enter your email'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSent(true)
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

      <div
        className="pixel-border-cyan"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '420px' }}
      >
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div className="glow-green" style={{ fontSize: '14px', marginBottom: '16px' }}>✉</div>
            <div style={{ fontSize: '9px', lineHeight: '2', marginBottom: '12px' }}>
              MAGIC LINK SENT!
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '8px', lineHeight: '2' }}>
              Check your email and click the link to enter the arena.
            </div>
            <button
              className="pixel-btn pixel-btn-dark"
              onClick={() => { setSent(false); setEmail('') }}
              style={{ marginTop: '20px', width: '100%', fontSize: '8px' }}
            >
              USE DIFFERENT EMAIL
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: 'var(--neon-cyan)',
                fontSize: '9px',
                marginBottom: '10px',
                letterSpacing: '2px',
              }}>
                ENTER YOUR EMAIL
              </label>
              <div className="pixel-border">
                <input
                  className="pixel-input"
                  type="email"
                  placeholder="hero@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="glow-mag" style={{ marginBottom: '16px', fontSize: '8px', textAlign: 'center' }}>
                !! {error} !!
              </div>
            )}

            <button
              className="pixel-btn pixel-btn-green"
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', fontSize: '10px', padding: '14px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'SENDING...' : '▶ SEND MAGIC LINK'}
            </button>

            <div style={{ marginTop: '20px', color: 'var(--text-dim)', fontSize: '7px', textAlign: 'center', lineHeight: '2' }}>
              NO PASSWORD NEEDED · FREE FOREVER
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '24px', color: 'var(--text-dim)', fontSize: '8px' }}>
        <span className="blink">_</span>
      </div>
    </main>
  )
}
