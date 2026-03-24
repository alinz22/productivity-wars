'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Habit } from '@/lib/supabase'

interface Props {
  userId: string
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const HABIT_ICONS = ['⚡', '💧', '📚', '🏃', '🧘', '🥗', '💪', '🎨', '🎵', '🛌']

function getTodayKey(): string {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
}

export default function HabitsTab({ userId }: Props) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formIcon, setFormIcon] = useState('⚡')
  const [formDays, setFormDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const todayKey = getTodayKey()

  const fetchHabits = useCallback(async () => {
    const res = await fetch('/api/habits')
    if (res.ok) {
      const data = await res.json()
      setHabits(data.habits ?? [])
      setCompletedToday(new Set(data.completedToday ?? []))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  const handleAdd = async () => {
    if (!formTitle.trim() || formDays.length === 0) return
    setSaving(true)
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: formTitle.trim(), icon: formIcon, target_days: formDays }),
    })
    if (res.ok) {
      setFormTitle('')
      setFormIcon('⚡')
      setFormDays(['mon', 'tue', 'wed', 'thu', 'fri'])
      setShowForm(false)
      fetchHabits()
    }
    setSaving(false)
  }

  const handleToggleDay = (day: string) => {
    setFormDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleComplete = async (habitId: string) => {
    setToggling(habitId)
    const res = await fetch(`/api/habits/${habitId}/complete`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setCompletedToday(prev => {
        const next = new Set(prev)
        if (data.done) next.add(habitId)
        else next.delete(habitId)
        return next
      })
      // Update streak in local state
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, current_streak: data.streak } : h))
    }
    setToggling(null)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    setHabits(prev => prev.filter(h => h.id !== id))
    setCompletedToday(prev => { const n = new Set(prev); n.delete(id); return n })
  }

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
        <div>
          <h2 className="glow-silver" style={{ fontSize: '11px', letterSpacing: '2px' }}>
            ▸ DAILY HABITS
          </h2>
          <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '1px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
          </div>
        </div>
        <button
          className="pixel-btn pixel-btn-silver"
          onClick={() => setShowForm(s => !s)}
          style={{ fontSize: '8px' }}
        >
          {showForm ? '✕ CANCEL' : '+ NEW HABIT'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="pixel-border-gold fade-in" style={{ background: 'var(--panel)', padding: '20px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '6px' }}>
              HABIT NAME
            </label>
            <div className="pixel-border">
              <input
                className="pixel-input"
                placeholder="e.g. Drink water..."
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
                style={{ fontSize: '9px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '8px' }}>
              SCHEDULED DAYS
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  style={{
                    flex: 1,
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7px',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    border: 'none',
                    background: formDays.includes(day) ? 'rgba(168,184,200,0.15)' : 'var(--panel)',
                    color: formDays.includes(day) ? 'var(--silver)' : 'var(--text-dim)',
                    outline: 'none',
                  }}
                  className={formDays.includes(day) ? 'pixel-border-gold' : 'pixel-border'}
                >
                  {DAY_LABELS[i]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '7px', letterSpacing: '2px', marginBottom: '8px' }}>
              ICON
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  style={{
                    fontSize: '16px',
                    padding: '6px 8px',
                    background: formIcon === icon ? 'rgba(168,184,200,0.12)' : 'var(--panel)',
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
            className="pixel-btn pixel-btn-silver"
            onClick={handleAdd}
            disabled={saving || formDays.length === 0}
            style={{ width: '100%', fontSize: '9px', opacity: (saving || formDays.length === 0) ? 0.6 : 1 }}
          >
            {saving ? 'SAVING...' : '▶ CREATE HABIT'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && !showForm && (
        <div className="pixel-border" style={{ background: 'var(--panel)', padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '14px' }}>⚡</div>
          <div style={{ color: 'var(--silver)', fontSize: '9px', marginBottom: '8px' }}>NO HABITS YET</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', lineHeight: '2' }}>
            Build your daily rituals. Small actions compound into greatness.
          </div>
        </div>
      )}

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {habits.map(habit => {
          const isDoneToday = completedToday.has(habit.id)
          const scheduledToday = habit.target_days.includes(todayKey)
          const isToggling = toggling === habit.id

          return (
            <div
              key={habit.id}
              className={`fade-in pixel-border${isDoneToday ? '-gold' : ''}`}
              style={{
                background: isDoneToday ? 'rgba(245,200,66,0.05)' : 'var(--panel)',
                padding: '14px 16px',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{habit.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {habit.title.toUpperCase()}
                  </div>
                  {habit.current_streak > 0 && (
                    <div style={{ fontSize: '7px', color: 'var(--ember)', marginTop: '3px' }}>
                      🔥 {habit.current_streak}d streak
                      {habit.longest_streak > habit.current_streak && (
                        <span style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>
                          best: {habit.longest_streak}d
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  className="pixel-btn pixel-btn-gray"
                  onClick={() => handleDelete(habit.id)}
                  style={{ fontSize: '7px', padding: '5px 8px', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>

              {/* Day schedule row */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                {DAYS.map((day, i) => {
                  const scheduled = habit.target_days.includes(day)
                  const isToday = day === todayKey
                  return (
                    <div
                      key={day}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '5px 2px',
                        fontSize: '6px',
                        fontFamily: "'Press Start 2P', monospace",
                        background: isToday && scheduled ? 'rgba(168,184,200,0.1)' : 'transparent',
                        color: scheduled
                          ? (isToday ? 'var(--silver)' : 'var(--text-dim)')
                          : 'rgba(122,122,154,0.3)',
                        boxShadow: isToday && scheduled
                          ? '-1px 0 0 0 var(--border), 1px 0 0 0 var(--border), 0 -1px 0 0 var(--border), 0 1px 0 0 var(--border)'
                          : undefined,
                      }}
                    >
                      {DAY_LABELS[i]}
                    </div>
                  )
                })}
              </div>

              {/* Today's completion button — only show if scheduled today */}
              {scheduledToday && (
                <button
                  className={`pixel-btn ${isDoneToday ? 'pixel-btn-gold' : 'pixel-btn-dark'}`}
                  onClick={() => handleComplete(habit.id)}
                  disabled={isToggling}
                  style={{ width: '100%', fontSize: '8px', opacity: isToggling ? 0.6 : 1 }}
                >
                  {isDoneToday ? '✓ DONE TODAY' : '· MARK DONE'}
                </button>
              )}
              {!scheduledToday && (
                <div style={{ fontSize: '7px', color: 'var(--text-dim)', textAlign: 'center', opacity: 0.5 }}>
                  NOT SCHEDULED TODAY
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
