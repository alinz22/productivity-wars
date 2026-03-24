'use client'

import { useState } from 'react'
import type { Task, Player } from '@/lib/supabase'
import type { Difficulty, Category, PlayerClass } from '@/lib/supabase'
import { getXpForTask, getClassDef, CATEGORIES } from '@/lib/classes'

interface Props {
  tasks: Task[]
  myPlayer: Player
  onComplete: (taskId: string) => void
  onAddTask: () => void
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

export default function TaskList({ tasks, myPlayer, onComplete, onAddTask, onFocus, activePomodoroTaskId }: Props) {
  const [completing, setCompleting] = useState<string | null>(null)

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)
  const classDef = getClassDef((myPlayer.class ?? 'warrior') as PlayerClass)

  const handleDone = async (task: Task) => {
    setCompleting(task.id)
    onComplete(task.id)
    setTimeout(() => setCompleting(null), 600)
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
        <button className="pixel-btn pixel-btn-gold" onClick={onAddTask} style={{ fontSize: '9px' }}>
          + NEW QUEST
        </button>
      </div>

      {pending.length === 0 && done.length === 0 && (
        <div
          className="pixel-border"
          style={{
            background: 'var(--panel)',
            padding: '36px 24px',
            textAlign: 'center',
            lineHeight: '2',
          }}
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

          return (
            <div
              key={task.id}
              className="fade-in pixel-border"
              style={{
                background: 'var(--panel)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: completing === task.id ? 0.5 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <span style={{ color: 'var(--ember)', fontSize: '8px' }}>
                      🍅×{task.pomodoro_count}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  className={`pixel-btn ${activePomodoroTaskId === task.id ? 'pixel-btn-magenta' : 'pixel-btn-dark'}`}
                  onClick={() => onFocus(task)}
                  style={{ fontSize: '7px', padding: '7px 8px' }}
                  title="Start Pomodoro focus session"
                >
                  {activePomodoroTaskId === task.id ? '🍅 FOCUS' : '🍅'}
                </button>
                <button
                  className="pixel-btn pixel-btn-gold"
                  onClick={() => handleDone(task)}
                  disabled={completing === task.id}
                  style={{ fontSize: '8px', padding: '8px 12px' }}
                >
                  ✓ DONE
                </button>
              </div>
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
