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
const RING_R = 130
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

type AppPhase = 'goal-input' | 'work' | 'break'

const QUOTES = [
  "The dungeon won't clear itself. Press onward.",
  "A warrior's greatest weapon is focus.",
  "Your rivals are resting. Don't join them.",
  "Champions are forged in the quiet hours.",
  "Block out the noise. The realm needs you.",
  "Every quest begins with a single step.",
  "The XP awaits those who persist.",
  "Stay in the zone. Distractions are the enemy.",
  "Eyes on the objective. Forward.",
  "Greatness is built one pomodoro at a time.",
]

function playTick() {
  if (typeof window === 'undefined') return
  try {
    const ctx = new AudioContext()
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = buf
    gain.gain.value = 0.04
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    src.onended = () => ctx.close()
  } catch {}
}

export default function PomodoroTimer({ taskId, taskTitle, onComplete, onClose }: Props) {
  const [appPhase, setAppPhase] = useState<AppPhase>('goal-input')
  const [goal, setGoal] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [running, setRunning] = useState(false)
  const [showAbandonWarning, setShowAbandonWarning] = useState(false)
  const [pomodorosThisSession, setPomodorosThisSession] = useState(0)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [xpFlash, setXpFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const quoteRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isWork = appPhase === 'work'
  const total = isWork ? WORK_SECONDS : BREAK_SECONDS
  const elapsed = total - secondsLeft
  const ringProgress = elapsed / total
  const dashOffset = RING_CIRCUMFERENCE * (1 - ringProgress)
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  const ringColor = isWork
    ? (secondsLeft > 10 * 60 ? '#f5c842' : secondsLeft > 3 * 60 ? '#f97316' : '#c0392b')
    : '#22c55e'
  const ringGlow = isWork
    ? (secondsLeft > 10 * 60 ? 'rgba(245,200,66,0.45)' : secondsLeft > 3 * 60 ? 'rgba(249,115,22,0.45)' : 'rgba(192,57,43,0.5)')
    : 'rgba(34,197,94,0.4)'

  // Countdown timer
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      playTick()
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          if (appPhase === 'work') {
            onComplete(taskId)
            setPomodorosThisSession(n => n + 1)
            setXpFlash(true)
            setTimeout(() => setXpFlash(false), 1800)
            setRunning(false)
            setAppPhase('break')
            setSecondsLeft(BREAK_SECONDS)
          } else {
            setRunning(false)
            setAppPhase('goal-input')
            setGoal('')
            setSecondsLeft(WORK_SECONDS)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, appPhase, taskId, onComplete])

  // Quote rotation
  useEffect(() => {
    if (!running || appPhase !== 'work') return
    quoteRef.current = setInterval(() => {
      setQuoteIndex(i => (i + 1) % QUOTES.length)
    }, 12000)
    return () => clearInterval(quoteRef.current!)
  }, [running, appPhase])

  const handleStartFocus = () => {
    setSecondsLeft(WORK_SECONDS)
    setAppPhase('work')
    setRunning(true)
  }

  const handleToggle = () => setRunning(r => !r)

  const handleReset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setSecondsLeft(isWork ? WORK_SECONDS : BREAK_SECONDS)
  }

  const handleClose = () => {
    if (appPhase === 'work' && running) {
      setShowAbandonWarning(true)
    } else {
      onClose()
    }
  }

  const handleSkipBreak = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setAppPhase('goal-input')
    setGoal('')
    setSecondsLeft(WORK_SECONDS)
  }

  const btnLabel = running
    ? '⏸ PAUSE'
    : secondsLeft === total
    ? (isWork ? '▶ BEGIN FOCUS' : '▶ START REST')
    : '▶ RESUME'

  // ── Goal input screen ──────────────────────────────────────────────────
  if (appPhase === 'goal-input') {
    return (
      <div
        className="modal-overlay"
        style={{ background: 'rgba(8,10,22,0.82)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <div
          className="pixel-border-gold fade-in"
          style={{
            background: 'var(--panel)',
            padding: '40px 36px',
            width: '100%',
            maxWidth: '500px',
            margin: 'auto',
            textAlign: 'center',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '4px', marginBottom: '10px' }}>
            NEW FOCUS SESSION
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--gold)',
            textShadow: '0 0 10px var(--gold)',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 10px',
          }}>
            ⚔ {taskTitle.toUpperCase()}
          </div>

          {pomodorosThisSession > 0 && (
            <div style={{ marginBottom: '24px', fontSize: '14px' }}>
              {Array.from({ length: Math.min(pomodorosThisSession + 3, 8) }).map((_, i) => (
                <span key={i} style={{ opacity: i < pomodorosThisSession ? 1 : 0.18, margin: '0 2px' }}>🍅</span>
              ))}
            </div>
          )}

          <div style={{ marginTop: '28px', marginBottom: '28px' }}>
            <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: '12px', textAlign: 'left' }}>
              SET YOUR OBJECTIVE <span style={{ opacity: 0.5 }}>(optional)</span>
            </div>
            <div className="pixel-border">
              <input
                className="pixel-input"
                placeholder="e.g. Finish the login flow..."
                value={goal}
                onChange={e => setGoal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStartFocus()}
                autoFocus
                style={{ fontSize: '9px' }}
              />
            </div>
          </div>

          <button
            className="pixel-btn pixel-btn-gold"
            onClick={handleStartFocus}
            style={{ width: '100%', fontSize: '10px', padding: '16px' }}
          >
            ▶ BEGIN FOCUS SESSION
          </button>

          <div style={{ marginTop: '16px', color: 'var(--text-dim)', fontSize: '7px', lineHeight: '2' }}>
            25 MIN FOCUS · 5 MIN REST · +5 XP ON COMPLETION
          </div>

          <button
            className="pixel-btn pixel-btn-gray"
            onClick={onClose}
            style={{ marginTop: '12px', width: '100%', fontSize: '8px' }}
          >
            ✕ CANCEL
          </button>
        </div>
      </div>
    )
  }

  // ── Shared SVG ring (work + break) ─────────────────────────────────────
  const ringPanel = (
    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
      <svg width="280" height="280" viewBox="0 0 300 300">
        <defs>
          <filter id="ring-glow-pom">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle cx="150" cy="150" r={RING_R} fill="none" stroke="var(--border)" strokeWidth="10" />

        {/* 60 tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 2 * Math.PI - Math.PI / 2
          const isMajor = i % 5 === 0
          const innerR = isMajor ? RING_R - 18 : RING_R - 12
          const outerR = RING_R + 4
          const lit = i < (elapsed / total) * 60
          return (
            <line
              key={i}
              x1={150 + innerR * Math.cos(angle)}
              y1={150 + innerR * Math.sin(angle)}
              x2={150 + outerR * Math.cos(angle)}
              y2={150 + outerR * Math.sin(angle)}
              stroke={lit ? ringColor : 'var(--border)'}
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
          filter="url(#ring-glow-pom)"
          style={{ transition: running ? 'stroke-dashoffset 1s linear' : undefined }}
        />

        {/* Time — key={secondsLeft} forces remount each second → triggers CSS animation */}
        <text
          key={secondsLeft}
          x="150" y="142"
          textAnchor="middle"
          fontFamily="'Press Start 2P', monospace"
          fontSize="36"
          fill={ringColor}
          className="tick-pulse"
          style={{ filter: `drop-shadow(0 0 12px ${ringColor})`, transformOrigin: '150px 142px' }}
        >
          {mins}:{secs}
        </text>

        {/* Sub-label */}
        <text
          x="150" y="170"
          textAnchor="middle"
          fontFamily="'Press Start 2P', monospace"
          fontSize="8"
          fill="var(--text-dim)"
          letterSpacing="3"
        >
          {isWork ? 'FOCUS' : 'REST'}
        </text>

        {/* Pulse dot */}
        {running && (
          <circle cx="150" cy="192" r="4" fill={ringColor} opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  )

  // ── Work / Break screen ────────────────────────────────────────────────
  return (
    <div
      className="modal-overlay"
      style={{
        background: 'rgba(8,10,22,0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        cursor: 'default',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          margin: 'auto',
          background: 'var(--panel)',
          textAlign: 'center',
          padding: '32px 28px 28px',
          position: 'relative',
          boxShadow: `0 0 70px ${ringGlow}, 0 0 140px ${ringGlow.replace('0.45', '0.15').replace('0.5', '0.15').replace('0.4', '0.12')}`,
        }}
      >
        {/* Phase banner */}
        <div style={{
          fontSize: '8px',
          letterSpacing: '4px',
          color: ringColor,
          textShadow: `0 0 12px ${ringColor}`,
          marginBottom: '6px',
        }}>
          {isWork ? '🍅 FOCUS SESSION' : '☕ WELL FOUGHT, HERO'}
        </div>

        {/* Task + goal */}
        <div style={{
          fontSize: '8px',
          color: 'var(--text-dim)',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 12px',
        }}>
          TASK: <span style={{ color: 'var(--text)' }}>{taskTitle.toUpperCase()}</span>
        </div>
        {goal && (
          <div style={{
            fontSize: '8px',
            color: 'var(--gold)',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 12px',
          }}>
            OBJ: {goal}
          </div>
        )}

        {/* Session count */}
        {(pomodorosThisSession > 0 || isWork) && (
          <div style={{ fontSize: '13px', marginBottom: '12px' }}>
            {Array.from({ length: Math.min(pomodorosThisSession + 4, 8) }).map((_, i) => (
              <span key={i} style={{ opacity: i < pomodorosThisSession ? 1 : 0.15, margin: '0 2px' }}>🍅</span>
            ))}
          </div>
        )}

        {/* Ring */}
        {ringPanel}

        {/* XP flash */}
        {xpFlash && (
          <div
            className="glow-gold xp-flash"
            style={{ fontSize: '11px', letterSpacing: '2px', marginBottom: '12px' }}
          >
            ★ +5 XP BONUS EARNED! ★
          </div>
        )}

        {/* Break message */}
        {!isWork && (
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '16px', lineHeight: '2' }}>
            Rest your mind. The next quest awaits.
          </div>
        )}

        {/* Quote (work phase only) */}
        {isWork && running && (
          <div
            key={quoteIndex}
            className="fade-in"
            style={{ color: 'var(--text-dim)', fontSize: '7px', marginBottom: '16px', lineHeight: '2.2', fontStyle: 'italic', padding: '0 12px' }}
          >
            &ldquo;{QUOTES[quoteIndex]}&rdquo;
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            className={`pixel-btn ${running ? 'pixel-btn-dark' : 'pixel-btn-gold'}`}
            onClick={handleToggle}
            style={{ flex: 3, fontSize: '9px', padding: '13px' }}
          >
            {btnLabel}
          </button>
          <button
            className="pixel-btn pixel-btn-dark"
            onClick={handleReset}
            style={{ flex: 1, fontSize: '8px' }}
          >
            ↺
          </button>
        </div>

        {!isWork && (
          <button
            className="pixel-btn pixel-btn-silver"
            onClick={handleSkipBreak}
            style={{ width: '100%', fontSize: '8px', marginBottom: '10px' }}
          >
            ⚡ SKIP BREAK
          </button>
        )}

        <button
          className="pixel-btn pixel-btn-gray"
          onClick={handleClose}
          style={{ width: '100%', fontSize: '8px' }}
        >
          ✕ {isWork ? 'ABANDON QUEST' : 'CLOSE'}
        </button>

        {/* Abandon warning dialog */}
        {showAbandonWarning && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8,10,22,0.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowAbandonWarning(false)}
          >
            <div
              className="pixel-border-crimson fade-in"
              style={{ background: 'var(--panel)', padding: '32px 28px', maxWidth: '340px', width: '100%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '18px', marginBottom: '14px' }}>⚠</div>
              <div style={{ fontSize: '9px', color: 'var(--crimson)', letterSpacing: '2px', marginBottom: '12px' }}>
                ABANDON QUEST?
              </div>
              <div style={{ fontSize: '8px', color: 'var(--text-dim)', lineHeight: '2.2', marginBottom: '24px' }}>
                You will forfeit the +5 XP bonus.<br />
                Your progress will not be saved.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="pixel-btn pixel-btn-gold"
                  onClick={() => setShowAbandonWarning(false)}
                  style={{ flex: 2, fontSize: '8px' }}
                >
                  STAY FOCUSED
                </button>
                <button
                  className="pixel-btn pixel-btn-crimson"
                  onClick={onClose}
                  style={{ flex: 1, fontSize: '8px' }}
                >
                  QUIT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
