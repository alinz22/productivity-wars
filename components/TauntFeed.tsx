'use client'

import type { Taunt } from '@/lib/supabase'

interface Props {
  taunts: Taunt[]
}

export default function TauntFeed({ taunts }: Props) {
  if (taunts.length === 0) {
    return (
      <div style={{ color: 'var(--text-dim)', fontSize: '8px', flex: 1 }}>
        No taunts yet... send the first shot!
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      {taunts.slice(0, 3).map((t, i) => (
        <div
          key={t.id}
          className="slide-in"
          style={{
            fontSize: '8px',
            color: i === 0 ? 'var(--neon-magenta)' : 'var(--text-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '260px',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--neon-cyan)', marginRight: '6px' }}>
            {t.from_name.toUpperCase()}:
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
