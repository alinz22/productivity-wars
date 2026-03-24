'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { getRank } from '@/lib/classes'
import Link from 'next/link'

interface StatsData {
  profile: { total_xp: number; all_time_streak: number; class: string; username: string } | null
  tasksByDay: Record<string, { created: number; completed: number }>
  totalCompleted: number
  pomodoroCount: number
  pomodoroWeek: number
  habitsByDay: Record<string, number>
  totalHabits: number
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function getLast28Days(): string[] {
  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - i))
    return d.toISOString().split('T')[0]
  })
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d.getDay()]
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="pixel-border" style={{ background: 'var(--panel)', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: '10px' }}>{label}</div>
      <div style={{ fontSize: '20px', color: color ?? 'var(--gold)', textShadow: `0 0 12px ${color ?? 'var(--gold)'}`, marginBottom: '6px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  )
}

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/stats')
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      fetchStats()
    })
  }, [router, fetchStats])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glow-gold pulse-glow" style={{ fontSize: '14px', letterSpacing: '3px' }}>LOADING...</div>
      </div>
    )
  }

  const profile = stats?.profile
  const rank = profile ? getRank(profile.total_xp) : null
  const last7 = getLast7Days()
  const last28 = getLast28Days()
  const tasksByDay = stats?.tasksByDay ?? {}
  const habitsByDay = stats?.habitsByDay ?? {}
  const totalHabits = stats?.totalHabits ?? 1
  const maxTasks = Math.max(1, ...last7.map(d => tasksByDay[d]?.completed ?? 0))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0' }}>
      {/* Header */}
      <header style={{ background: 'var(--panel)', borderBottom: '2px solid var(--border)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="glow-gold" style={{ fontSize: '12px', letterSpacing: '2px' }}>📊 STATS</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="pixel-btn pixel-btn-gray" style={{ fontSize: '8px', padding: '7px 12px' }}>← LOBBY</button>
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          <StatCard
            label="TOTAL XP"
            value={profile?.total_xp?.toLocaleString() ?? '0'}
            sub={rank?.label}
            color={rank?.color ?? 'var(--gold)'}
          />
          <StatCard
            label="QUESTS DONE"
            value={stats?.totalCompleted ?? 0}
            sub="all time"
            color="var(--gold)"
          />
          <StatCard
            label="BEST STREAK"
            value={`${profile?.all_time_streak ?? 0}d`}
            sub="days"
            color="var(--ember)"
          />
          <StatCard
            label="POMODOROS"
            value={stats?.pomodoroCount ?? 0}
            sub={`${stats?.pomodoroWeek ?? 0} this week`}
            color="var(--crimson)"
          />
        </div>

        {/* Tasks per day — last 7 days */}
        <div className="pixel-border" style={{ background: 'var(--panel)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '9px', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '16px' }}>
            ▸ QUESTS COMPLETED — LAST 7 DAYS
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
            {last7.map(day => {
              const count = tasksByDay[day]?.completed ?? 0
              const heightPct = maxTasks > 0 ? (count / maxTasks) * 100 : 0
              const isToday = day === new Date().toISOString().split('T')[0]
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '7px', color: 'var(--gold)' }}>{count > 0 ? count : ''}</div>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%`,
                    background: isToday ? 'var(--gold)' : count > 0 ? 'rgba(245,200,66,0.5)' : 'var(--border)',
                    boxShadow: isToday && count > 0 ? '0 0 8px var(--gold)' : undefined,
                    minHeight: '2px',
                    transition: 'height 0.3s ease',
                  }} />
                  <div style={{ fontSize: '6px', color: isToday ? 'var(--gold)' : 'var(--text-dim)', letterSpacing: '1px' }}>
                    {dayLabel(day)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Habit heatmap — last 28 days */}
        <div className="pixel-border" style={{ background: 'var(--panel)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '9px', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '16px' }}>
            ▸ HABIT ACTIVITY — LAST 4 WEEKS
          </div>
          {totalHabits === 0 ? (
            <div style={{ fontSize: '8px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
              NO HABITS TRACKED YET
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(d => (
                  <div key={d} style={{ fontSize: '6px', color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '1px' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {last28.map(day => {
                  const count = habitsByDay[day] ?? 0
                  const ratio = count / totalHabits
                  const bg = ratio === 0
                    ? 'var(--border)'
                    : ratio < 0.4
                    ? 'rgba(245,200,66,0.25)'
                    : ratio < 0.75
                    ? 'rgba(245,200,66,0.6)'
                    : 'var(--gold)'
                  const isToday = day === new Date().toISOString().split('T')[0]
                  return (
                    <div
                      key={day}
                      title={`${day}: ${count} habit${count !== 1 ? 's' : ''}`}
                      style={{
                        height: '18px',
                        background: bg,
                        boxShadow: isToday ? '0 0 0 1px var(--gold)' : undefined,
                      }}
                    />
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '6px', color: 'var(--text-dim)' }}>LESS</span>
                {['var(--border)', 'rgba(245,200,66,0.25)', 'rgba(245,200,66,0.6)', 'var(--gold)'].map((bg, i) => (
                  <div key={i} style={{ width: '12px', height: '12px', background: bg }} />
                ))}
                <span style={{ fontSize: '6px', color: 'var(--text-dim)' }}>MORE</span>
              </div>
            </>
          )}
        </div>

        {/* Class info */}
        {profile && (
          <div className="pixel-border" style={{ background: 'var(--panel)', padding: '20px' }}>
            <div style={{ fontSize: '9px', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '14px' }}>
              ▸ HERO STATUS
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '4px' }}>HERO</div>
                <div style={{ fontSize: '10px', color: 'var(--text)' }}>{profile.username.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '4px' }}>CLASS</div>
                <div style={{ fontSize: '10px', color: 'var(--text)' }}>{profile.class.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '4px' }}>RANK</div>
                <div style={{ fontSize: '10px', color: rank?.color ?? 'var(--gold)' }}>{rank?.label ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '4px' }}>TOTAL XP</div>
                <div style={{ fontSize: '10px', color: 'var(--gold)' }}>{profile.total_xp.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
