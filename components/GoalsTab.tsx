'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Goal } from '@/lib/supabase'

interface Props {
  userId: string
  onGoalsChange?: (goals: Goal[]) => void
}

const GOAL_ICONS = ['🎯', '⚔', '🏆', '🌟', '🔥', '💎', '🛡', '🗡', '📜', '🧙']

export default function GoalsTab({ userId, onGoalsChange }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formIcon, setFormIcon] = useState('🎯')
  const [formTarget, setFormTarget] = useState('10')
  const [formDeadline, setFormDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchGoals = useCallback(async () => {
    const res = await fetch('/api/goals')
    if (res.ok) {
      const data = await res.json()
      setGoals(data)
      onGoalsChange?.(data)
    }
    setLoading(false)
  }, [onGoalsChange])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const handleAdd = async () => {
    if (!formTitle.trim()) return
    setSaving(true)
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formTitle.trim(),
        icon: formIcon,
        target_tasks: parseInt(formTarget) || 10,
        deadline: formDeadline || null,
      }),
    })
    if (res.ok) {
      setFormTitle('')
      setFormIcon('🎯')
      setFormTarget('10')
      setFormDeadline('')
      setShowForm(false)
      fetchGoals()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setGoals(prev => prev.filter(g => g.id !== id))
    onGoalsChange?.(goals.filter(g => g.id !== id))
  }

  const handleArchive = async (goal: Goal) => {
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    })
    if (res.ok) fetchGoals()
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '9px' }}>
        LOADING...
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 className="glow-gold" style={{ fontSize: '11px', letterSpacing: '2px' }}>
          ▸ LONG-TERM GOALS
        </h2>
        <button
          className="pixel-btn pixel-btn-gold"
          onClick={() => setShowForm(s => !s)}
          style={{ fontSize: '8px' }}
        >
          {showForm ? '✕ CANCEL' : '+ NEW GOAL'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="pixel-border-gold fade-in" style={{ background: 'var(--panel)', padding: '20px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '6px' }}>
              GOAL TITLE
            </label>
            <div className="pixel-border">
              <input
                className="pixel-input"
                placeholder="e.g. Launch my app..."
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
                style={{ fontSize: '9px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '6px' }}>
                TARGET QUESTS
              </label>
              <div className="pixel-border">
                <input
                  className="pixel-input"
                  type="number"
                  min="1"
                  max="999"
                  value={formTarget}
                  onChange={e => setFormTarget(e.target.value)}
                  style={{ fontSize: '9px' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '6px' }}>
                DEADLINE <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <div className="pixel-border">
                <input
                  className="pixel-input"
                  type="date"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                  style={{ fontSize: '9px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '8px' }}>
              ICON
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {GOAL_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  style={{
                    fontSize: '16px',
                    padding: '6px 8px',
                    background: formIcon === icon ? 'rgba(245,200,66,0.15)' : 'var(--panel)',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: formIcon === icon ? 1 : 0.5,
                  }}
                  className={formIcon === icon ? 'pixel-border-gold' : 'pixel-border'}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <button
            className="pixel-btn pixel-btn-gold"
            onClick={handleAdd}
            disabled={saving}
            style={{ width: '100%', fontSize: '9px', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'SAVING...' : '▶ CREATE GOAL'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {activeGoals.length === 0 && completedGoals.length === 0 && !showForm && (
        <div className="pixel-border" style={{ background: 'var(--panel)', padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '14px' }}>🎯</div>
          <div style={{ color: 'var(--gold)', fontSize: '9px', marginBottom: '8px' }}>NO GOALS SET</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', lineHeight: '2' }}>
            Set a long-term objective. Link quests to track progress.
          </div>
        </div>
      )}

      {/* Active goals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {activeGoals.map(goal => {
          const pct = Math.min((goal.completed_count / goal.target_tasks) * 100, 100)
          const daysLeft = goal.deadline
            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
            : null
          return (
            <div key={goal.id} className="pixel-border fade-in" style={{ background: 'var(--panel)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{goal.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {goal.title.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {goal.completed_count}/{goal.target_tasks} QUESTS
                    {daysLeft !== null && (
                      <span style={{ marginLeft: '10px', color: daysLeft < 7 ? 'var(--crimson)' : 'var(--text-dim)' }}>
                        · {daysLeft > 0 ? `${daysLeft}d left` : 'OVERDUE'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="pixel-btn pixel-btn-gray"
                  onClick={() => handleDelete(goal.id)}
                  style={{ fontSize: '7px', padding: '5px 8px', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', background: 'var(--border)', overflow: 'hidden', marginBottom: pct === 100 ? '10px' : '0' }}>
                <div
                  className="xp-bar-fill"
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: pct >= 100 ? 'var(--neon-green)' : 'var(--gold)',
                    boxShadow: `0 0 6px ${pct >= 100 ? 'var(--neon-green)' : 'var(--gold)'}`,
                  }}
                />
              </div>

              {pct >= 100 && (
                <button
                  className="pixel-btn pixel-btn-green"
                  onClick={() => handleArchive(goal)}
                  style={{ width: '100%', fontSize: '8px', marginTop: '6px' }}
                >
                  ✓ MARK COMPLETE
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <>
          <div style={{ color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '10px' }}>
            COMPLETED ({completedGoals.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {completedGoals.map(goal => (
              <div
                key={goal.id}
                style={{
                  background: 'var(--panel)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: 0.55,
                  borderLeft: '3px solid var(--neon-green)',
                }}
              >
                <span style={{ color: 'var(--neon-green)', fontSize: '10px' }}>✓</span>
                <span style={{ fontSize: '16px' }}>{goal.icon}</span>
                <div style={{ flex: 1, fontSize: '8px', textDecoration: 'line-through', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {goal.title.toUpperCase()}
                </div>
                <button
                  className="pixel-btn pixel-btn-gray"
                  onClick={() => handleDelete(goal.id)}
                  style={{ fontSize: '6px', padding: '4px 6px', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
