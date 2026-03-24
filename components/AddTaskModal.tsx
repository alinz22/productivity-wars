'use client'

import { useState } from 'react'
import type { Difficulty, Category, PlayerClass, Goal } from '@/lib/supabase'
import { CATEGORIES, getXpForTask, getClassDef } from '@/lib/classes'

interface Props {
  playerClass: PlayerClass
  goals?: Goal[]
  onAdd: (title: string, difficulty: Difficulty, category: Category, goalId: string | null) => void
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

export default function AddTaskModal({ playerClass, goals, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [category, setCategory] = useState<Category>('daily')
  const [goalId, setGoalId] = useState<string | null>(null)

  const classDef = getClassDef(playerClass)
  const xpPreview = getXpForTask(difficulty, category, playerClass)
  const isBonus = classDef.affinity === category && category !== 'daily'

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onAdd(t, difficulty, category, goalId)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-gold fade-in"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '460px' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="glow-gold" style={{ fontSize: '11px', marginBottom: '24px', letterSpacing: '2px' }}>
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
                  className={isSelected ? 'pixel-border-gold' : 'pixel-border'}
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
                className={`${DIFF_CLASS[d.value]} ${difficulty === d.value ? 'pixel-border-gold' : 'pixel-border'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Link to Goal */}
        {goals && goals.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', color: 'var(--silver)', fontSize: '8px', marginBottom: '8px', letterSpacing: '2px' }}>
              LINK TO GOAL <span style={{ opacity: 0.5 }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setGoalId(null)}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '7px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  border: 'none',
                  background: goalId === null ? 'var(--border)' : 'var(--panel)',
                  color: 'var(--text-dim)',
                  outline: 'none',
                }}
                className={goalId === null ? 'pixel-border-gold' : 'pixel-border'}
              >
                NONE
              </button>
              {goals.filter(g => g.status === 'active').map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setGoalId(goal.id)}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    border: 'none',
                    background: goalId === goal.id ? 'rgba(0,0,0,0.6)' : 'var(--panel)',
                    color: 'var(--gold)',
                    outline: 'none',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  className={goalId === goal.id ? 'pixel-border-gold' : 'pixel-border'}
                >
                  {goal.icon} {goal.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* XP Preview */}
        <div
          className="pixel-border"
          style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', marginBottom: '20px', fontSize: '8px' }}
        >
          <span style={{ color: 'var(--text-dim)' }}>XP REWARD: </span>
          <span style={{ color: 'var(--gold)' }}>+{xpPreview} XP</span>
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
          <button className="pixel-btn pixel-btn-gold" onClick={handleSubmit} style={{ flex: 1, fontSize: '9px' }}>
            ▶ ADD QUEST
          </button>
        </div>
      </div>
    </div>
  )
}
