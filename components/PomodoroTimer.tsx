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

const RING_R = 130
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

export default function PomodoroTimer({ taskId, taskTitle, onComplete, onClose }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [phase, setPhase] = useState<Phase>('work')
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = phase === 'work' ? WORK_SECONDS : BREAK_SECONDS
  const elapsed = total - secondsLeft
  const ringProgress = elapsed / total
  const dashOffset = RING_CIRCUMFERENCE * (1 - ringProgress)
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  const isWork = phase === 'work'
  const ringColor = isWork ? '#f5c842' : '#22c55e'
  const ringGlow = isWork ? 'rgba(245,200,66,0.5)' : 'rgba(34,197,94,0.5)'

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

  const btnLabel = running
    ? '⏸ PAUSE'
    : secondsLeft === total
    ? (isWork ? '▶ BEGIN FOCUS' : '▶ START BREAK')
    : '▶ RESUME'

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ alignItems: 'flex-start', paddingTop: '0', background: 'rgba(5,6,15,0.92)' }}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '600px',
          margin: 'auto',
          background: 'var(--panel)',
          textAlign: 'center',
          padding: '40px 32px 36px',
          position: 'relative',
          boxShadow: `0 0 60px ${ringGlow}, 0 0 120px ${ringGlow.replace('0.5', '0.2')}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Phase label */}
        <div style={{
          fontSize: '8px',
          letterSpacing: '4px',
          color: ringColor,
          textShadow: `0 0 12px ${ringColor}`,
          marginBottom: '8px',
        }}>
          {isWork ? '🍅 FOCUS SESSION' : '☕ BREAK TIME'}
        </div>

        {/* Task title — the "mission" */}
        <div style={{
          fontSize: '9px',
          color: 'var(--text-dim)',
          letterSpacing: '1px',
          marginBottom: '32px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 20px',
        }}>
          MISSION: <span style={{ color: 'var(--text)' }}>{taskTitle.toUpperCase()}</span>
        </div>

        {/* SVG ring */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '28px' }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            {/* Defs for filter glow */}
            <defs>
              <filter id="ring-glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track */}
            <circle
              cx="150" cy="150" r={RING_R}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
            />

            {/* Pixel tick marks */}
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (i / 60) * 2 * Math.PI - Math.PI / 2
              const isMajor = i % 5 === 0
              const innerR = isMajor ? RING_R - 18 : RING_R - 12
              const outerR = RING_R + 4
              return (
                <line
                  key={i}
                  x1={150 + innerR * Math.cos(angle)}
                  y1={150 + innerR * Math.sin(angle)}
                  x2={150 + outerR * Math.cos(angle)}
                  y2={150 + outerR * Math.sin(angle)}
                  stroke={i < (elapsed / total) * 60 ? ringColor : 'var(--border)'}
                  strokeWidth={isMajor ? 2.5 : 1.5}
                  opacity={isMajor ? 1 : 0.6}
                />
              )
            })}

            {/* Progress arc */}
            <circle
              cx="150" cy="150" r={RING_R}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="square"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 150 150)"
              filter="url(#ring-glow)"
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : undefined }}
            />

            {/* Center: time */}
            <text
              x="150" y="140"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="38"
              fill={ringColor}
              style={{ filter: `drop-shadow(0 0 12px ${ringColor})` }}
            >
              {mins}:{secs}
            </text>

            {/* Center: phase sub-label */}
            <text
              x="150" y="172"
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize="9"
              fill="var(--text-dim)"
              letterSpacing="2"
            >
              {isWork ? 'FOCUS' : 'REST'}
            </text>

            {/* Running pulse dot */}
            {running && (
              <circle cx="150" cy="196" r="4" fill={ringColor} opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>
        </div>

        {/* XP bonus earned banner */}
        {completed && (
          <div
            className="glow-gold"
            style={{ fontSize: '10px', marginBottom: '20px', letterSpacing: '2px' }}
          >
            ★ +5 XP BONUS EARNED! ★
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <button
            className={`pixel-btn ${running ? 'pixel-btn-gray' : 'pixel-btn-gold'}`}
            onClick={toggleRunning}
            style={{ flex: 3, fontSize: '10px', padding: '14px' }}
          >
            {btnLabel}
          </button>
          <button
            className="pixel-btn pixel-btn-dark"
            onClick={reset}
            style={{ flex: 1, fontSize: '9px' }}
          >
            ↺ RESET
          </button>
        </div>

        <button
          className="pixel-btn pixel-btn-gray"
          onClick={onClose}
          style={{ width: '100%', fontSize: '8px' }}
        >
          ✕ CLOSE (session continues in background)
        </button>

        <div style={{ marginTop: '16px', color: 'var(--text-dim)', fontSize: '7px', lineHeight: '2.2' }}>
          25 MIN FOCUS · 5 MIN REST · +5 XP ON COMPLETION
        </div>
      </div>
    </div>
  )
}
