'use client'

import { useEffect, useState } from 'react'

interface Props {
  label: string
  onDone: () => void
}

export default function AchievementToast({ label, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 3600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(30px)'}`,
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s ease',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div
        className="pixel-border-green"
        style={{
          background: 'var(--panel)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '16px' }}>🏆</span>
        <div>
          <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '4px', letterSpacing: '2px' }}>
            ACHIEVEMENT UNLOCKED
          </div>
          <div className="glow-yellow" style={{ fontSize: '8px' }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}
