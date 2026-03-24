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
          <h2 className="glow-mag" style={{ fontSize: '10px', letterSpacing: '2px' }}>
            ▸ YOUR QUESTS
          </h2>
          <div style={{ fontSize: '7px', color: classDef.color, marginTop: '4px' }}>
            {classDef.icon} {classDef.name} · 2x on {classDef.affinity.toUpperCase()}
          </div>
        </div>
        <button className="pixel-btn pixel-btn-green" onClick={onAddTask} style={{ fontSize: '8px' }}>
          + NEW QUEST
        </button>
      </div>

      {pending.length === 0 && done.length === 0 && (
        <div
          className="pixel-border"
          style={{
            background: 'var(--panel)',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '8px',
            lineHeight: '2.5',
          }}
        >
          NO QUESTS YET.
          <br />
          ADD ONE TO START EARNING XP!
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
                <div style={{ fontSize: '9px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={DIFF_CLASS[task.difficulty as Difficulty]} style={{ fontSize: '7px' }}>
                    [{DIFF_LABEL[task.difficulty as Difficulty]}]
                  </span>
                  <span style={{ color: catDef.color, fontSize: '7px' }}>
                    {catDef.icon} {catDef.label}
                  </span>
                  <span style={{ color: isBonus ? 'var(--neon-yellow)' : 'var(--text-dim)', fontSize: '7px' }}>
                    +{xp} XP{isBonus ? ' ★' : ''}
                  </span>
                  {task.pomodoro_count > 0 && (
                    <span style={{ color: 'var(--neon-magenta)', fontSize: '7px' }}>
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
                  className="pixel-btn pixel-btn-cyan"
                  onClick={() => handleDone(task)}
                  disabled={completing === task.id}
                  style={{ fontSize: '7px', padding: '7px 10px' }}
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
                    borderLeft: '3px solid var(--neon-green)',
                  }}
                >
                  <span style={{ color: 'var(--neon-green)', fontSize: '10px' }}>✓</span>
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
