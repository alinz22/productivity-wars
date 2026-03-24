'use client'

import { useState } from 'react'
import type { Task } from '@/lib/supabase'
import { XP_VALUES } from '@/lib/supabase'

interface Props {
  tasks: Task[]
  onComplete: (taskId: string, xpGain: number) => void
  onAddTask: () => void
}

const DIFF_LABEL: Record<string, string> = {
  easy: 'EASY',
  medium: 'MED',
  hard: 'HARD',
}

const DIFF_CLASS: Record<string, string> = {
  easy: 'diff-easy',
  medium: 'diff-medium',
  hard: 'diff-hard',
}

export default function TaskList({ tasks, onComplete, onAddTask }: Props) {
  const [completing, setCompleting] = useState<string | null>(null)

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  const handleDone = async (task: Task) => {
    setCompleting(task.id)
    const xp = XP_VALUES[task.difficulty] ?? 1
    onComplete(task.id, xp)
    setTimeout(() => setCompleting(null), 600)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 className="glow-mag" style={{ fontSize: '10px', letterSpacing: '2px' }}>
          ▸ YOUR QUESTS
        </h2>
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
        {pending.map(task => (
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
              <div style={{ fontSize: '9px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.title}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className={`${DIFF_CLASS[task.difficulty]}`} style={{ fontSize: '7px' }}>
                  [{DIFF_LABEL[task.difficulty]}]
                </span>
                <span style={{ color: 'var(--neon-yellow)', fontSize: '7px' }}>
                  +{XP_VALUES[task.difficulty]} XP
                </span>
              </div>
            </div>
            <button
              className="pixel-btn pixel-btn-cyan"
              onClick={() => handleDone(task)}
              disabled={completing === task.id}
              style={{ fontSize: '7px', padding: '7px 10px', flexShrink: 0 }}
            >
              ✓ DONE
            </button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '8px', letterSpacing: '1px' }}>
            COMPLETED ({done.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {done.map(task => (
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
                <span style={{ color: 'var(--neon-yellow)', fontSize: '7px', flexShrink: 0 }}>
                  +{XP_VALUES[task.difficulty]} XP
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
