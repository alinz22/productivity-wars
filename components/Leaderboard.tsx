'use client'

import type { Player } from '@/lib/supabase'
import type { PlayerClass } from '@/lib/supabase'
import { getRank, getClassDef } from '@/lib/classes'

const MEDALS = ['👑', '🥈', '🥉']

interface Props {
  players: Player[]
  myPlayerId: string
}

export default function Leaderboard({ players, myPlayerId }: Props) {
  const sorted = [...players].sort((a, b) => b.xp - a.xp)
  const topXp = Math.max(sorted[0]?.xp ?? 1, 1)

  return (
    <div style={{ padding: '20px' }}>
      <h2 className="glow-cyan" style={{ fontSize: '10px', letterSpacing: '2px', marginBottom: '20px' }}>
        ▸ LEADERBOARD
      </h2>

      {sorted.length === 0 && (
        <div className="pixel-border" style={{ background: 'var(--panel)', padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚔</div>
          <div style={{ color: 'var(--gold)', fontSize: '9px', marginBottom: '8px' }}>THE ARENA AWAITS</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', lineHeight: '2' }}>No heroes have entered yet.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sorted.map((player, i) => {
          const isMe = player.id === myPlayerId
          const barWidth = Math.max((player.xp / Math.max(topXp, 100)) * 100, 2)
          const rank = getRank(player.xp)
          const cls = getClassDef((player.class ?? 'warrior') as PlayerClass)

          return (
            <div
              key={player.id}
              className={`fade-in ${isMe ? 'pixel-border-gold' : 'pixel-border'}`}
              style={{
                background: isMe ? 'rgba(245,200,66,0.08)' : 'var(--panel)',
                padding: '12px',
                position: 'relative',
              }}
            >
              {/* Rank + name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', flexShrink: 0 }}>
                  {MEDALS[i] ?? `#${i + 1}`}
                </span>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{cls.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '9px',
                      color: isMe ? 'var(--gold)' : 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {player.name.toUpperCase()}
                    {isMe && (
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '7px', marginLeft: '6px' }}>(YOU)</span>
                    )}
                  </div>
                  <div style={{ fontSize: '7px', color: rank.color, marginTop: '2px' }}>
                    {rank.label}
                    {player.in_focus && (
                      <span style={{ color: 'var(--ember)', marginLeft: '8px' }}>🍅 FOCUS</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--neon-yellow)', flexShrink: 0 }}>
                  {player.xp} XP
                </div>
              </div>

              {/* XP bar */}
              <div style={{ height: '5px', background: 'var(--border)', width: '100%', overflow: 'hidden' }}>
                <div
                  className="xp-bar-fill"
                  style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: isMe
                      ? 'var(--gold)'
                      : i === 0
                      ? 'var(--neon-yellow)'
                      : cls.color,
                    boxShadow: isMe ? '0 0 8px var(--gold)' : undefined,
                  }}
                />
              </div>

              {/* Streak */}
              {player.streak > 0 && (
                <div style={{ marginTop: '5px', fontSize: '7px', color: 'var(--neon-yellow)' }}>
                  🔥 {player.streak}d streak
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
