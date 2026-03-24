'use client'

import { useCallback, useState } from 'react'
import type { Task, Player, TaskSubtask } from '@/lib/supabase'
import type { Difficulty, Category, PlayerClass } from '@/lib/supabase'
import { getXpForTask, getClassDef, CATEGORIES } from '@/lib/classes'

interface Props {
  tasks: Task[]
  myPlayer: Player
  onComplete: (taskId: string) => void
  onAddTask: () => void
  onTemplates?: () => void
  onFocus: (task: Task) => void
  activePomodoroTaskId: string | null
}

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MED',
  hard: 'HARD',
}

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

function dueBadge(dueDate: string): { label: string; color: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return { label: 'OVERDUE', color: 'var(--crimson)' }
  if (diffDays === 0) return { label: 'DUE TODAY', color: 'var(--ember)' }
  if (diffDays === 1) return { label: '1d left', color: 'var(--ember)' }
  return { label: `${diffDays}d left`, color: 'var(--text-dim)' }
}

function SubtaskList({ taskId, initialSubtasks }: { taskId: string; initialSubtasks?: TaskSubtask[] }) {
  const [subtasks, setSubtasks] = useState<TaskSubtask[] | null>(initialSubtasks ?? null)
  const [loading, setLoading] = useState(false)

  const fetchSubtasks = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/tasks/${taskId}/subtasks`)
    if (res.ok) setSubtasks(await res.json())
    setLoading(false)
  }, [taskId])

  const toggle = async (subtask: TaskSubtask) => {
    const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtask_id: subtask.id, completed: !subtask.completed }),
    })
    if (res.ok) {
      const updated: TaskSubtask = await res.json()
      setSubtasks(prev => prev ? prev.map(s => s.id === updated.id ? updated : s) : prev)
    }
  }

  if (subtasks === null) {
    return (
      <button
        onClick={fetchSubtasks}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--silver)', padding: '0' }}
      >
        {loading ? 'LOADING...' : '▸ LOAD STEPS'}
      </button>
    )
  }

  if (subtasks.length === 0) return null

  const done = subtasks.filter(s => s.completed).length
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '4px' }}>
        STEPS {done}/{subtasks.length}
      </div>
      {subtasks.map(s => (
        <div
          key={s.id}
          onClick={() => toggle(s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 0',
            cursor: 'pointer',
            fontSize: '7px',
            color: s.completed ? 'var(--text-dim)' : 'var(--text)',
            textDecoration: s.completed ? 'line-through' : 'none',
          }}
        >
          <span style={{ color: s.completed ? 'var(--gold)' : 'var(--border)', fontSize: '8px', flexShrink: 0 }}>
            {s.completed ? '☑' : '☐'}
          </span>
          {s.title}
        </div>
      ))}
    </div>
  )
}

export default function TaskList({ tasks, myPlayer, onComplete, onAddTask, onTemplates, onFocus, activePomodoroTaskId }: Props) {
  const [completing, setCompleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // P1 first, then P2, P3, then no priority
  const PRIORITY_ORDER: Record<string, number> = { p1: 0, p2: 1, p3: 2 }
  const sortTasks = (arr: Task[]) => [...arr].sort((a, b) => {
    const pa = a.priority ? PRIORITY_ORDER[a.priority] : 3
    const pb = b.priority ? PRIORITY_ORDER[b.priority] : 3
    return pa - pb
  })

  const pending = sortTasks(tasks.filter(t => !t.completed))
  const done = tasks.filter(t => t.completed)
  const classDef = getClassDef((myPlayer.class ?? 'warrior') as PlayerClass)

  const handleDone = async (task: Task) => {
    setCompleting(task.id)
    onComplete(task.id)
    setTimeout(() => setCompleting(null), 600)
  }

  const toggleExpand = (taskId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const getCategoryDef = (cat: Category) =>
    CATEGORIES.find(c => c.id === cat) ?? CATEGORIES[4]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 className="glow-gold" style={{ fontSize: '11px', letterSpacing: '2px' }}>
            ▸ YOUR QUESTS
          </h2>
          <div style={{ fontSize: '7px', color: classDef.color, marginTop: '4px' }}>
            {classDef.icon} {classDef.name} · 2x on {classDef.affinity.toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onTemplates && (
            <button className="pixel-btn pixel-btn-gray" onClick={onTemplates} style={{ fontSize: '7px', padding: '7px 10px' }} title="Quest Templates">
              📋
            </button>
          )}
          <button className="pixel-btn pixel-btn-gold" onClick={onAddTask} style={{ fontSize: '9px' }}>
            + NEW QUEST
          </button>
        </div>
      </div>

      {pending.length === 0 && done.length === 0 && (
        <div
          className="pixel-border"
          style={{ background: 'var(--panel)', padding: '36px 24px', textAlign: 'center', lineHeight: '2' }}
        >
          <div style={{ fontSize: '28px', marginBottom: '16px' }}>⚔</div>
          <div style={{ color: 'var(--gold)', fontSize: '10px', marginBottom: '10px' }}>NO ACTIVE QUESTS</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px' }}>Your legend begins with a single task.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {pending.map(task => {
          const catDef = getCategoryDef((task.category ?? 'daily') as Category)
          const xp = getXpForTask(
            task.difficulty as Difficulty,
            (task.category ?? 'daily') as Category,
            (myPlayer.class ?? 'warrior') as PlayerClass
          )
          const isBonus = classDef.affinity === task.category && task.category !== 'daily'
          const isExpanded = expanded.has(task.id)
          const due = task.due_date ? dueBadge(task.due_date) : null
          const borderClass = task.priority === 'p1' ? 'pixel-border-crimson' : 'pixel-border'

          return (
            <div
              key={task.id}
              className={`fade-in ${borderClass}`}
              style={{
                background: 'var(--panel)',
                padding: '12px 14px',
                opacity: completing === task.id ? 0.5 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Top row: title + actions */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Priority + title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    {task.priority && (
                      <span style={{ fontSize: '7px', color: PRIORITY_COLORS[task.priority], flexShrink: 0 }}>
                        [{task.priority.toUpperCase()}]
                      </span>
                    )}
                    <span style={{ fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {task.title}
                    </span>
                  </div>
                  {/* Badges row */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={DIFF_CLASS[task.difficulty as Difficulty]} style={{ fontSize: '8px' }}>
                      [{DIFF_LABEL[task.difficulty as Difficulty]}]
                    </span>
                    <span style={{ color: catDef.color, fontSize: '8px' }}>
                      {catDef.icon} {catDef.label}
                    </span>
                    <span style={{ color: isBonus ? 'var(--gold)' : 'var(--text-dim)', fontSize: '8px' }}>
                      +{xp} XP{isBonus ? ' ★' : ''}
                    </span>
                    {task.pomodoro_count > 0 && (
                      <span style={{ color: 'var(--ember)', fontSize: '8px' }}>🍅×{task.pomodoro_count}</span>
                    )}
                    {due && (
                      <span style={{ fontSize: '7px', color: due.color }}>{due.label}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  {(task.description || (task as any).has_subtasks) && (
                    <button
                      className="pixel-btn pixel-btn-dark"
                      onClick={() => toggleExpand(task.id)}
                      style={{ fontSize: '7px', padding: '6px 8px' }}
                      title="Expand details"
                    >
                      {isExpanded ? '▴' : '▾'}
                    </button>
                  )}
                  <button
                    className={`pixel-btn ${activePomodoroTaskId === task.id ? 'pixel-btn-magenta' : 'pixel-btn-dark'}`}
                    onClick={() => onFocus(task)}
                    style={{ fontSize: '7px', padding: '7px 8px' }}
                    title="Start Pomodoro"
                  >
                    {activePomodoroTaskId === task.id ? '🍅 FOCUS' : '🍅'}
                  </button>
                  <button
                    className="pixel-btn pixel-btn-gold"
                    onClick={() => handleDone(task)}
                    disabled={completing === task.id}
                    style={{ fontSize: '8px', padding: '8px 10px' }}
                  >
                    ✓ DONE
                  </button>
                </div>
              </div>

              {/* Expandable: description + subtasks */}
              {isExpanded && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  {task.description && (
                    <div style={{ fontSize: '8px', color: 'var(--text-dim)', lineHeight: '1.8', marginBottom: '8px' }}>
                      {task.description}
                    </div>
                  )}
                  <SubtaskList taskId={task.id} />
                </div>
              )}

              {/* Auto-show subtasks expand button if task has description or subtasks */}
              {!isExpanded && (task.description) && (
                <button
                  onClick={() => toggleExpand(task.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--text-dim)', marginTop: '6px', padding: '0' }}
                >
                  ▸ DETAILS
                </button>
              )}
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '8px', letterSpacing: '1px' }}>
            COMPLETED ({done.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {done.map(task => {
              const xp = getXpForTask(
                task.difficulty as Difficulty,
                (task.category ?? 'daily') as Category,
                (myPlayer.class ?? 'warrior') as PlayerClass
              )
              return (
                <div
                  key={task.id}
                  style={{
                    background: 'var(--panel)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: 0.5,
                    borderLeft: '3px solid var(--gold)',
                  }}
                >
                  <span style={{ color: 'var(--gold)', fontSize: '10px' }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '8px', textDecoration: 'line-through', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </div>
                  </div>
                  <span style={{ color: 'var(--neon-yellow)', fontSize: '7px', flexShrink: 0 }}>+{xp} XP</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
