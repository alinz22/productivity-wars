'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRank, getClassDef } from '@/lib/classes'
import type { PlayerClass } from '@/lib/supabase'

interface HeroEntry {
  id: string
  username: string
  class: PlayerClass
  total_xp: number
  all_time_streak: number
}

const MEDALS = ['👑', '🥈', '🥉']

export default function GlobalLeaderboardPage() {
  const router = useRouter()
  const [heroes, setHeroes] = useState<HeroEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => { setHeroes(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  return (
    <main style={{ minHeight: '100vh', padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '3px', marginBottom: '8px' }}>
            ALL-TIME RECORDS
          </div>
          <h1 className="glow-yellow" style={{ fontSize: '16px', letterSpacing: '3px' }}>
            🏆 HALL OF FAME
          </h1>
        </div>
        <button
          className="pixel-btn pixel-btn-dark"
          onClick={() => router.push('/')}
          style={{ fontSize: '8px' }}
        >
          ← BACK TO LOBBY
        </button>
      </div>

      {loading && (
        <div className="glow-green pulse-glow" style={{ fontSize: '12px', textAlign: 'center', marginTop: '60px' }}>
          LOADING...
        </div>
      )}

      {!loading && heroes.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '9px', marginTop: '60px' }}>
          NO HEROES YET. BE THE FIRST!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {heroes.map((hero, i) => {
          const rank = getRank(hero.total_xp)
          const cls = getClassDef(hero.class)
          const isTop3 = i < 3

          return (
            <div
              key={hero.id}
              className={`fade-in ${isTop3 ? 'pixel-border-cyan' : 'pixel-border'}`}
              style={{
                background: isTop3 ? 'rgba(0,212,255,0.05)' : 'var(--panel)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              {/* Position */}
              <div style={{ fontSize: isTop3 ? '18px' : '10px', flexShrink: 0, width: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
                {MEDALS[i] ?? `#${i + 1}`}
              </div>

              {/* Class icon */}
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{cls.icon}</span>

              {/* Name + rank */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '9px', color: cls.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hero.username}
                </div>
                <div style={{ fontSize: '7px', marginTop: '3px' }}>
                  <span style={{ color: rank.color }}>{rank.label}</span>
                  <span style={{ color: 'var(--text-dim)', marginLeft: '10px' }}>{cls.name}</span>
                  {hero.all_time_streak > 0 && (
                    <span style={{ color: 'var(--neon-yellow)', marginLeft: '10px' }}>
                      🔥 {hero.all_time_streak}d
                    </span>
                  )}
                </div>
              </div>

              {/* XP */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-yellow)' }}>
                  {hero.total_xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '7px', lineHeight: '2.5' }}>
        TOP 100 HEROES · UPDATED IN REAL-TIME
        <br />
        <span className="blink">_</span>
      </div>
    </main>
  )
}
