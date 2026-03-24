'use client'

import { useState } from 'react'
import type { Difficulty } from '@/lib/supabase'

interface Props {
  onAdd: (title: string, difficulty: Difficulty) => void
  onClose: () => void
}

const DIFFICULTIES: { value: Difficulty; label: string; xp: number; cls: string }[] = [
  { value: 'easy',   label: 'EASY',   xp: 1, cls: 'diff-easy'   },
  { value: 'medium', label: 'MEDIUM', xp: 3, cls: 'diff-medium' },
  { value: 'hard',   label: 'HARD',   xp: 5, cls: 'diff-hard'   },
]

export default function AddTaskModal({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onAdd(t, difficulty)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-green fade-in"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '420px' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="glow-green" style={{ fontSize: '11px', marginBottom: '24px', letterSpacing: '2px' }}>
          NEW QUEST
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '8px', letterSpacing: '2px' }}>
            QUEST NAME
          </label>
          <div className="pixel-border">
            <input
              className="pixel-input"
              placeholder="WHAT NEEDS DOING..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              maxLength={60}
              autoFocus
            />
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '8px', letterSpacing: '2px' }}>
            DIFFICULTY
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                style={{
                  flex: 1,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  padding: '10px 6px',
                  cursor: 'pointer',
                  border: 'none',
                  background: difficulty === d.value ? 'var(--border)' : 'var(--panel)',
                  outline: 'none',
                  transition: 'background 0.15s',
                }}
                className={`${d.cls} ${difficulty === d.value ? 'pixel-border-green' : 'pixel-border'}`}
              >
                {d.label}
                <br />
                <span style={{ color: 'var(--neon-yellow)', fontSize: '7px' }}>+{d.xp} XP</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ flex: 1 }}>
            CANCEL
          </button>
          <button className="pixel-btn pixel-btn-green" onClick={handleSubmit} style={{ flex: 1, fontSize: '9px' }}>
            ▶ ADD QUEST
          </button>
        </div>
      </div>
    </div>
  )
}
