'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CLASSES } from '@/lib/classes'
import type { PlayerClass } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('warrior')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'username' | 'class'>('username')

  const handleUsernameNext = () => {
    const clean = username.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
    if (clean.length < 3) { setError('Min 3 characters (A-Z, 0-9, _)'); return }
    if (clean.length > 16) { setError('Max 16 characters'); return }
    setUsername(clean)
    setError('')
    setStep('class')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, class: selectedClass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const classDef = CLASSES.find(c => c.id === selectedClass)!

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
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '3px', marginBottom: '12px' }}>
          NEW HERO REGISTRATION
        </div>
        <h1 className="glow-cyan" style={{ fontSize: '18px', letterSpacing: '3px' }}>
          CREATE YOUR CHARACTER
        </h1>
      </div>

      {/* Step 1: Username */}
      {step === 'username' && (
        <div
          className="pixel-border-cyan fade-in"
          style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '440px' }}
        >
          <div style={{ marginBottom: '8px', color: 'var(--neon-cyan)', fontSize: '8px', letterSpacing: '2px' }}>
            STEP 1 OF 2 — CHOOSE YOUR NAME
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '7px', marginBottom: '24px' }}>
            This is your permanent hero name. Choose wisely.
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="pixel-border">
              <input
                className="pixel-input"
                placeholder="HERONAME..."
                value={username}
                onChange={e => setUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleUsernameNext()}
                maxLength={16}
                autoFocus
              />
            </div>
            <div style={{ marginTop: '6px', color: 'var(--text-dim)', fontSize: '7px' }}>
              3-16 chars · A-Z, 0-9, underscore
            </div>
          </div>

          {error && (
            <div className="glow-mag" style={{ marginBottom: '12px', fontSize: '8px' }}>!! {error} !!</div>
          )}

          <button
            className="pixel-btn pixel-btn-green"
            onClick={handleUsernameNext}
            style={{ width: '100%', fontSize: '10px', padding: '14px' }}
          >
            NEXT →
          </button>
        </div>
      )}

      {/* Step 2: Class */}
      {step === 'class' && (
        <div
          className="pixel-border-cyan fade-in"
          style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '520px' }}
        >
          <div style={{ marginBottom: '8px', color: 'var(--neon-cyan)', fontSize: '8px', letterSpacing: '2px' }}>
            STEP 2 OF 2 — CHOOSE YOUR CLASS
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '7px', marginBottom: '24px' }}>
            Your class determines XP bonuses. Pick your playstyle.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {CLASSES.map(cls => {
              const isSelected = selectedClass === cls.id
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    background: isSelected ? 'rgba(0,0,0,0.6)' : 'var(--panel)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '16px 12px',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  className={isSelected ? 'pixel-border-green' : 'pixel-border'}
                >
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{cls.icon}</div>
                  <div style={{ fontSize: '9px', color: cls.color, marginBottom: '6px' }}>
                    {cls.name}
                  </div>
                  <div style={{ fontSize: '7px', color: 'var(--text-dim)', lineHeight: '1.9' }}>
                    {cls.lore}
                  </div>
                </button>
              )
            })}
          </div>

          <div
            className="pixel-border"
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '8px',
              color: classDef.color,
            }}
          >
            {classDef.icon} {username} · {classDef.name}
          </div>

          {error && (
            <div className="glow-mag" style={{ marginBottom: '12px', fontSize: '8px' }}>!! {error} !!</div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="pixel-btn pixel-btn-gray"
              onClick={() => { setStep('username'); setError('') }}
              style={{ flex: 1 }}
            >
              ← BACK
            </button>
            <button
              className="pixel-btn pixel-btn-green"
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 2, fontSize: '9px', padding: '12px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'CREATING...' : '▶ ENTER THE ARENA'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
