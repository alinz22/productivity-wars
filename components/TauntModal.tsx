'use client'

const TAUNTS = [
  "Is that all you've got? 😴",
  "My grandma works faster than you.",
  "Touch grass... after you finish your tasks! 🌿",
  "Leaderboard called, it wants you higher.",
  "Less scrolling, more grinding. 💀",
  "You call that productive?! 😂",
  "Even I'm embarrassed for you. 🫡",
]

interface Props {
  onSend: (message: string) => void
  onClose: () => void
}

export default function TauntModal({ onSend, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-magenta fade-in"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '420px' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="glow-mag" style={{ fontSize: '11px', marginBottom: '24px', letterSpacing: '2px' }}>
          ⚡ SEND TAUNT
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {TAUNTS.map((t, i) => (
            <button
              key={i}
              onClick={() => onSend(t)}
              className="pixel-border"
              style={{
                background: 'var(--panel)',
                color: 'var(--text)',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left',
                lineHeight: '1.8',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,0,170,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--panel)')}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ width: '100%' }}>
          NEVER MIND
        </button>
      </div>
    </div>
  )
}
