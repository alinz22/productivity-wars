'use client'

import { useState } from 'react'
import type { Difficulty, Category, PlayerClass, Goal } from '@/lib/supabase'
import { CATEGORIES, getXpForTask, getClassDef } from '@/lib/classes'

export interface TaskFormData {
  title: string
  difficulty: Difficulty
  category: Category
  goalId: string | null
  description: string | null
  dueDate: string | null
  priority: 'p1' | 'p2' | 'p3' | null
  subtasks: string[]
}

interface Props {
  playerClass: PlayerClass
  goals?: Goal[]
  onAdd: (data: TaskFormData) => void
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

const PRIORITY_COLORS: Record<string, string> = {
  p1: 'var(--crimson)',
  p2: 'var(--ember)',
  p3: 'var(--silver)',
}

export default function AddTaskModal({ playerClass, goals, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [category, setCategory] = useState<Category>('daily')
  const [goalId, setGoalId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'p1' | 'p2' | 'p3' | null>(null)
  const [subtasks, setSubtasks] = useState<string[]>([''])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const classDef = getClassDef(playerClass)
  const xpPreview = getXpForTask(difficulty, category, playerClass)
  const isBonus = classDef.affinity === category && category !== 'daily'

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onAdd({
      title: t,
      difficulty,
      category,
      goalId,
      description: description.trim() || null,
      dueDate: dueDate || null,
      priority,
      subtasks: subtasks.map(s => s.trim()).filter(Boolean),
    })
  }

  const updateSubtask = (i: number, val: string) => {
    setSubtasks(prev => prev.map((s, idx) => idx === i ? val : s))
  }

  const addSubtaskField = () => {
    if (subtasks.length < 5) setSubtasks(prev => [...prev, ''])
  }

  const removeSubtask = (i: number) => {
    setSubtasks(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-gold fade-in"
        style={{ background: 'var(--panel)', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="glow-gold" style={{ fontSize: '11px', marginBottom: '20px', letterSpacing: '2px' }}>
          NEW QUEST
        </h2>

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
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

        {/* Priority + Due Date row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
              PRIORITY
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['p1', 'p2', 'p3'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(priority === p ? null : p)}
                  style={{
                    flex: 1,
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    background: priority === p ? 'rgba(0,0,0,0.5)' : 'var(--panel)',
                    color: PRIORITY_COLORS[p],
                  }}
                  className={priority === p ? 'pixel-border-gold' : 'pixel-border'}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '130px' }}>
            <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
              DUE DATE <span style={{ opacity: 0.5 }}>(opt)</span>
            </label>
            <div className="pixel-border">
              <input
                className="pixel-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ fontSize: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
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
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
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

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(s => !s)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7px',
            color: 'var(--text-dim)',
            marginBottom: '14px',
            letterSpacing: '1px',
          }}
        >
          {showAdvanced ? '▾' : '▸'} {showAdvanced ? 'HIDE DETAILS' : 'ADD DETAILS'}
        </button>

        {showAdvanced && (
          <div style={{ marginBottom: '16px' }}>
            {/* Description */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: 'var(--silver)', fontSize: '7px', marginBottom: '6px', letterSpacing: '2px' }}>
                DESCRIPTION <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <div className="pixel-border">
                <textarea
                  className="pixel-input"
                  placeholder="Notes, context, links..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  style={{ fontSize: '8px', resize: 'vertical', minHeight: '60px' }}
                />
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label style={{ display: 'block', color: 'var(--silver)', fontSize: '7px', marginBottom: '6px', letterSpacing: '2px' }}>
                CHECKLIST <span style={{ opacity: 0.5 }}>(up to 5)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {subtasks.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div className="pixel-border" style={{ flex: 1 }}>
                      <input
                        className="pixel-input"
                        placeholder={`Step ${i + 1}...`}
                        value={s}
                        onChange={e => updateSubtask(i, e.target.value)}
                        maxLength={80}
                        style={{ fontSize: '8px' }}
                      />
                    </div>
                    {subtasks.length > 1 && (
                      <button
                        onClick={() => removeSubtask(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '10px', padding: '0 4px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {subtasks.length < 5 && (
                  <button
                    onClick={addSubtaskField}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--silver)', textAlign: 'left', padding: '4px 0' }}
                  >
                    + ADD STEP
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Link to Goal */}
        {goals && goals.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'var(--silver)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
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
          style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', marginBottom: '18px', fontSize: '8px' }}
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
