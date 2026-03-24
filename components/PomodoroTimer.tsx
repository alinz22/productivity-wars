'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  taskId: string
  taskTitle: string
  onComplete: (taskId: string) => void
  onClose: () => void
}

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

type Phase = 'work' | 'break'

export default function PomodoroTimer({ taskId, taskTitle, onComplete, onClose }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [phase, setPhase] = useState<Phase>('work')
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = phase === 'work' ? WORK_SECONDS : BREAK_SECONDS
  const progress = ((total - secondsLeft) / total) * 100
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          if (phase === 'work') {
            onComplete(taskId)
            setCompleted(true)
            setRunning(false)
            setPhase('break')
            setSecondsLeft(BREAK_SECONDS)
          } else {
            setPhase('work')
            setSecondsLeft(WORK_SECONDS)
            setRunning(false)
            setCompleted(false)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, phase, taskId, onComplete])

  const toggleRunning = () => setRunning(r => !r)

  const reset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setPhase('work')
    setSecondsLeft(WORK_SECONDS)
    setCompleted(false)
  }

  const phaseColor = phase === 'work' ? 'var(--neon-magenta)' : 'var(--neon-green)'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-magenta fade-in"
        style={{ background: 'var(--panel)', padding: '32px', width: '100%', maxWidth: '380px', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: '8px' }}>
          {phase === 'work' ? '🍅 FOCUS SESSION' : '☕ BREAK TIME'}
        </div>

        <div style={{
          fontSize: '7px',
          color: 'var(--text-dim)',
          marginBottom: '20px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {taskTitle}
        </div>

        {/* Circular-ish progress bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '32px',
              fontFamily: "'Press Start 2P', monospace",
              color: phaseColor,
              textShadow: `0 0 20px ${phaseColor}`,
              letterSpacing: '4px',
            }}
          >
            {mins}:{secs}
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', background: 'var(--border)', width: '100%', marginTop: '12px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: phaseColor,
                boxShadow: `0 0 8px ${phaseColor}`,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {completed && (
          <div className="glow-green" style={{ fontSize: '8px', marginBottom: '16px' }}>
            +5 XP BONUS EARNED!
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <button
            className={`pixel-btn ${running ? 'pixel-btn-gray' : 'pixel-btn-magenta'}`}
            onClick={toggleRunning}
            style={{ flex: 2, fontSize: '9px' }}
          >
            {running ? '⏸ PAUSE' : (secondsLeft === (phase === 'work' ? WORK_SECONDS : BREAK_SECONDS) ? '▶ START' : '▶ RESUME')}
          </button>
          <button
            className="pixel-btn pixel-btn-dark"
            onClick={reset}
            style={{ flex: 1, fontSize: '8px' }}
          >
            RESET
          </button>
        </div>

        <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ width: '100%', fontSize: '8px' }}>
          CLOSE
        </button>

        <div style={{ marginTop: '14px', color: 'var(--text-dim)', fontSize: '7px', lineHeight: '2' }}>
          Complete a 25min session to earn +5 bonus XP
        </div>
      </div>
    </div>
  )
}
