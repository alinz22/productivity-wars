'use client'

import type { Player } from '@/lib/supabase'

const MEDALS = ['👑', '🥈', '🥉']
const MAX_XP_FOR_BAR = 100

interface Props {
  players: Player[]
  myPlayerId: string
}

export default function Leaderboard({ players, myPlayerId }: Props) {
  const sorted = [...players].sort((a, b) => b.xp - a.xp)
  const topXp = Math.max(sorted[0]?.xp ?? 1, 1)

  return (
    <div style={{ padding: '20px' }}>
      <h2
        className="glow-cyan"
        style={{ fontSize: '10px', letterSpacing: '2px', marginBottom: '20px' }}
      >
        ▸ LEADERBOARD
      </h2>

      {sorted.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          No players yet...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sorted.map((player, i) => {
          const isMe = player.id === myPlayerId
          const barWidth = Math.max((player.xp / Math.max(topXp, MAX_XP_FOR_BAR)) * 100, 2)

          return (
            <div
              key={player.id}
              className={`fade-in ${isMe ? 'pixel-border-green' : 'pixel-border'}`}
              style={{
                background: isMe ? 'rgba(0,255,136,0.05)' : 'var(--panel)',
                padding: '14px',
                position: 'relative',
              }}
            >
              {/* Rank + name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>
                  {MEDALS[i] ?? `#${i + 1}`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '9px',
                      color: isMe ? 'var(--neon-green)' : 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold',
                    }}
                  >
                    {player.name.toUpperCase()}
                    {isMe && (
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '7px', marginLeft: '6px' }}>
                        (YOU)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--neon-yellow)', flexShrink: 0 }}>
                  {player.xp} XP
                </div>
              </div>

              {/* XP bar */}
              <div
                style={{
                  height: '6px',
                  background: 'var(--border)',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="xp-bar-fill"
                  style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: isMe
                      ? 'var(--neon-green)'
                      : i === 0
                      ? 'var(--neon-yellow)'
                      : 'var(--neon-cyan)',
                    boxShadow: isMe ? '0 0 8px var(--neon-green)' : undefined,
                  }}
                />
              </div>

              {/* Streak */}
              {player.streak > 0 && (
                <div style={{ marginTop: '6px', fontSize: '7px', color: 'var(--neon-yellow)' }}>
                  🔥 {player.streak} day streak
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
