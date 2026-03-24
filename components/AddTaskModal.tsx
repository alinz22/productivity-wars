'use client'

import { useState } from 'react'
import type { Difficulty, Category, PlayerClass } from '@/lib/supabase'
import { CATEGORIES, getXpForTask, getClassDef } from '@/lib/classes'

interface Props {
  playerClass: PlayerClass
  onAdd: (title: string, difficulty: Difficulty, category: Category) => void
  onClose: () => void
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy',   label: 'EASY'   },
  { value: 'medium', label: 'MEDIUM' },
  { value: 'hard',   label: 'HARD'   },
]

const DIFF_CLASS: Record<Difficulty, string> = {
  easy: 'diff-easy',
  medium: 'diff-medium',
  hard: 'diff-hard',
}

export default function AddTaskModal({ playerClass, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [category, setCategory] = useState<Category>('daily')

  const classDef = getClassDef(playerClass)
  const xpPreview = getXpForTask(difficulty, category, playerClass)
  const isBonus = classDef.affinity === category && category !== 'daily'

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onAdd(t, difficulty, category)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-green fade-in"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '460px' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="glow-green" style={{ fontSize: '11px', marginBottom: '24px', letterSpacing: '2px' }}>
          NEW QUEST
        </h2>

        {/* Title */}
        <div style={{ marginBottom: '18px' }}>
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

        {/* Category */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '8px', letterSpacing: '2px' }}>
            QUEST TYPE
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const isSelected = category === cat.id
              const isAffinity = classDef.affinity === cat.id && cat.id !== 'daily'
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    border: 'none',
                    background: isSelected ? 'rgba(0,0,0,0.6)' : 'var(--panel)',
                    color: cat.color,
                    outline: 'none',
                    transition: 'background 0.15s',
                    position: 'relative',
                  }}
                  className={isSelected ? 'pixel-border-green' : 'pixel-border'}
                >
                  {cat.icon} {cat.label}
                  {isAffinity && (
                    <span style={{ color: 'var(--neon-yellow)', fontSize: '6px', display: 'block', marginTop: '2px' }}>
                      2x XP
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: '20px' }}>
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
                className={`${DIFF_CLASS[d.value]} ${difficulty === d.value ? 'pixel-border-green' : 'pixel-border'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* XP Preview */}
        <div
          className="pixel-border"
          style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', marginBottom: '20px', fontSize: '8px' }}
        >
          <span style={{ color: 'var(--text-dim)' }}>XP REWARD: </span>
          <span style={{ color: 'var(--neon-yellow)' }}>+{xpPreview} XP</span>
          {isBonus && (
            <span style={{ color: classDef.color, marginLeft: '10px', fontSize: '7px' }}>
              {classDef.icon} 2x CLASS BONUS!
            </span>
          )}
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
