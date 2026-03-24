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

// SVG hourglass with animated sand fill
function Hourglass({ pct, color, running }: { pct: number; color: string; running: boolean }) {
  // pct = fraction of time remaining (1.0 = full, 0.0 = empty)
  // Sand in top chamber depletes, sand in bottom chamber fills
  const W = 120
  const H = 200
  const NECK_Y = 92
  const NECK_W = 10
  const TOP_APEX_Y = 18
  const BOT_APEX_Y = H - 18

  // Top glass inner shape (triangle, apex at top)
  const topLeft = (y: number) => {
    const frac = (y - TOP_APEX_Y) / (NECK_Y - TOP_APEX_Y)
    return W / 2 - frac * (W / 2 - NECK_W / 2)
  }
  const topRight = (y: number) => W - topLeft(y)

  // Bottom glass inner shape (triangle, apex at bottom)
  const botLeft = (y: number) => {
    const frac = (BOT_APEX_Y - y) / (BOT_APEX_Y - NECK_Y)
    return W / 2 - frac * (W / 2 - NECK_W / 2)
  }
  const botRight = (y: number) => W - botLeft(y)

  // Sand in top chamber: fill from NECK_Y upward based on pct
  // When pct=1: fill all the way up (top sand level = TOP_APEX_Y)
  // When pct=0: no sand in top
  const topSandLevel = TOP_APEX_Y + (1 - pct) * (NECK_Y - TOP_APEX_Y)

  // Sand in bottom chamber: fill from NECK_Y downward
  // When pct=1: no sand in bottom
  // When pct=0: full bottom
  const botSandStart = NECK_Y + pct * (BOT_APEX_Y - NECK_Y - 8)

  // Build path for top sand region
  const topSandPath = pct > 0 ? `
    M ${topLeft(topSandLevel)} ${topSandLevel}
    L ${topRight(topSandLevel)} ${topSandLevel}
    L ${topRight(NECK_Y)} ${NECK_Y}
    L ${topLeft(NECK_Y)} ${NECK_Y}
    Z
  ` : ''

  // Build path for bottom sand region
  const botSandPath = pct < 1 ? `
    M ${botLeft(botSandStart)} ${botSandStart}
    L ${botRight(botSandStart)} ${botSandStart}
    L ${botRight(BOT_APEX_Y)} ${BOT_APEX_Y}
    L ${botLeft(BOT_APEX_Y)} ${BOT_APEX_Y}
    Z
  ` : ''

  // Outer hourglass frame
  const frameTop = `M ${W/2} ${TOP_APEX_Y} L ${W - 8} ${NECK_Y} L ${8} ${NECK_Y} Z`
  const frameBot = `M ${8} ${NECK_Y} L ${W - 8} ${NECK_Y} L ${W/2} ${BOT_APEX_Y} Z`

  // Pixel-art notches on frame
  const notchCount = 8
  const notches = Array.from({ length: notchCount })

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="sand-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Clip top chamber */}
        <clipPath id="top-clip">
          <polygon points={`${W/2},${TOP_APEX_Y} ${W-8},${NECK_Y} 8,${NECK_Y}`} />
        </clipPath>
        {/* Clip bottom chamber */}
        <clipPath id="bot-clip">
          <polygon points={`8,${NECK_Y} ${W-8},${NECK_Y} ${W/2},${BOT_APEX_Y}`} />
        </clipPath>
      </defs>

      {/* Frame shadow/glow */}
      <path d={frameTop} fill="none" stroke={color} strokeWidth="2" opacity="0.18" filter="url(#sand-glow)" />
      <path d={frameBot} fill="none" stroke={color} strokeWidth="2" opacity="0.18" filter="url(#sand-glow)" />

      {/* Top chamber glass background */}
      <polygon
        points={`${W/2},${TOP_APEX_Y} ${W-8},${NECK_Y} 8,${NECK_Y}`}
        fill="rgba(0,0,0,0.35)"
        stroke={color}
        strokeWidth="2"
        opacity="0.85"
      />
      {/* Bottom chamber glass background */}
      <polygon
        points={`8,${NECK_Y} ${W-8},${NECK_Y} ${W/2},${BOT_APEX_Y}`}
        fill="rgba(0,0,0,0.35)"
        stroke={color}
        strokeWidth="2"
        opacity="0.85"
      />

      {/* Neck rect */}
      <rect
        x={W/2 - NECK_W/2} y={NECK_Y - 2} width={NECK_W} height={4}
        fill={color} opacity="0.6"
      />

      {/* Top sand */}
      {pct > 0.01 && (
        <g clipPath="url(#top-clip)">
          <path d={topSandPath} fill={color} opacity="0.82" filter="url(#sand-glow)" />
        </g>
      )}

      {/* Bottom sand */}
      {pct < 0.99 && (
        <g clipPath="url(#bot-clip)">
          <path d={botSandPath} fill={color} opacity="0.72" filter="url(#sand-glow)" />
        </g>
      )}

      {/* Falling sand particle */}
      {running && pct > 0.02 && (
        <g>
          {[0, 0.33, 0.66].map((offset, i) => (
            <circle key={i} cx={W/2 + (i - 1) * 2} cy={NECK_Y} r="1.5" fill={color} opacity="0.7">
              <animate
                attributeName="cy"
                from={NECK_Y}
                to={NECK_Y + 20}
                dur="0.6s"
                begin={`${offset}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.8"
                to="0"
                dur="0.6s"
                begin={`${offset}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}

      {/* Notch marks on sides */}
      {notches.map((_, i) => {
        const frac = (i + 1) / (notchCount + 1)
        const y = TOP_APEX_Y + frac * (NECK_Y - TOP_APEX_Y)
        const lx = topLeft(y)
        return (
          <g key={i} opacity="0.3">
            <line x1={lx - 3} y1={y} x2={lx} y2={y} stroke={color} strokeWidth="1.5" />
            <line x1={W - lx} y1={y} x2={W - lx + 3} y2={y} stroke={color} strokeWidth="1.5" />
          </g>
        )
      })}

      {/* Pixel corner caps */}
      {[[W/2 - 4, TOP_APEX_Y - 4, 8, 4], [W/2 - 4, BOT_APEX_Y, 8, 4]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={color} opacity="0.6" />
      ))}
    </svg>
  )
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
  const pct = secondsLeft / total // fraction remaining (1.0 = full, 0.0 = empty)
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  const sandColor = isWork
    ? (secondsLeft > 10 * 60 ? '#f5c842' : secondsLeft > 3 * 60 ? '#f97316' : '#c0392b')
    : '#22c55e'
  const glowColor = isWork
    ? (secondsLeft > 10 * 60 ? 'rgba(245,200,66,0.45)' : secondsLeft > 3 * 60 ? 'rgba(249,115,22,0.45)' : 'rgba(192,57,43,0.5)')
    : 'rgba(34,197,94,0.4)'

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

  // ── Goal input screen ────────────────────────────────────────────────
  if (appPhase === 'goal-input') {
    return (
      <div
        className="modal-overlay"
        style={{ background: 'rgba(8,10,22,0.82)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <div
          className="pixel-border-gold fade-in"
          style={{ background: 'var(--panel)', padding: '40px 36px', width: '100%', maxWidth: '500px', margin: 'auto', textAlign: 'center' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '4px', marginBottom: '10px' }}>
            NEW FOCUS SESSION
          </div>
          <div style={{ fontSize: '10px', color: 'var(--gold)', textShadow: '0 0 10px var(--gold)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 10px' }}>
            🍅 {taskTitle.toUpperCase()}
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
          <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ marginTop: '12px', width: '100%', fontSize: '8px' }}>
            ✕ CANCEL
          </button>
        </div>
      </div>
    )
  }

  // ── Work / Break screen ───────────────────────────────────────────────
  return (
    <div
      className="modal-overlay"
      style={{ background: 'rgba(8,10,22,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', cursor: 'default' }}
      onClick={e => e.stopPropagation()}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: 'auto',
          background: 'var(--panel)',
          textAlign: 'center',
          padding: '28px 24px 24px',
          position: 'relative',
          boxShadow: `0 0 70px ${glowColor}, 0 0 140px ${glowColor.replace(/[\d.]+\)$/, '0.12)')}`,
        }}
      >
        {/* Phase banner */}
        <div style={{ fontSize: '8px', letterSpacing: '4px', color: sandColor, textShadow: `0 0 12px ${sandColor}`, marginBottom: '6px' }}>
          {isWork ? '🍅 FOCUS SESSION' : '☕ WELL FOUGHT, HERO'}
        </div>

        {/* Task + goal */}
        <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 12px' }}>
          TASK: <span style={{ color: 'var(--text)' }}>{taskTitle.toUpperCase()}</span>
        </div>
        {goal && (
          <div style={{ fontSize: '8px', color: 'var(--gold)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 12px' }}>
            OBJ: {goal}
          </div>
        )}

        {/* Pomodoro count */}
        {(pomodorosThisSession > 0 || isWork) && (
          <div style={{ fontSize: '13px', marginBottom: '12px' }}>
            {Array.from({ length: Math.min(pomodorosThisSession + 4, 8) }).map((_, i) => (
              <span key={i} style={{ opacity: i < pomodorosThisSession ? 1 : 0.15, margin: '0 2px' }}>🍅</span>
            ))}
          </div>
        )}

        {/* Hourglass + time display */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          <Hourglass pct={pct} color={sandColor} running={running} />
          {/* Time overlay in center of hourglass */}
          <div
            key={secondsLeft}
            className="tick-pulse"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '22px',
              color: sandColor,
              textShadow: `0 0 14px ${sandColor}`,
              transformOrigin: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {mins}:{secs}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7px',
            color: 'var(--text-dim)',
            letterSpacing: '3px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {isWork ? 'FOCUS' : 'REST'}
          </div>
          {running && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: sandColor,
              pointerEvents: 'none',
            }}>
              <style>{`@keyframes pulse-dot { 0%,100%{opacity:0.9} 50%{opacity:0.2} }`}</style>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: sandColor, animation: 'pulse-dot 1s ease-in-out infinite' }} />
            </div>
          )}
        </div>

        {/* XP flash */}
        {xpFlash && (
          <div className="glow-gold xp-flash" style={{ fontSize: '11px', letterSpacing: '2px', marginBottom: '12px' }}>
            ★ +5 XP BONUS EARNED! ★
          </div>
        )}

        {/* Break message */}
        {!isWork && (
          <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '16px', lineHeight: '2' }}>
            Rest your mind. The next quest awaits.
          </div>
        )}

        {/* Quote */}
        {isWork && running && (
          <div key={quoteIndex} className="fade-in" style={{ color: 'var(--text-dim)', fontSize: '7px', marginBottom: '16px', lineHeight: '2.2', fontStyle: 'italic', padding: '0 12px' }}>
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
          <button className="pixel-btn pixel-btn-dark" onClick={handleReset} style={{ flex: 1, fontSize: '8px' }}>
            ↺
          </button>
        </div>

        {!isWork && (
          <button className="pixel-btn pixel-btn-silver" onClick={handleSkipBreak} style={{ width: '100%', fontSize: '8px', marginBottom: '10px' }}>
            ⚡ SKIP BREAK
          </button>
        )}

        <button className="pixel-btn pixel-btn-gray" onClick={handleClose} style={{ width: '100%', fontSize: '8px' }}>
          ✕ {isWork ? 'ABANDON QUEST' : 'CLOSE'}
        </button>

        {/* Abandon warning */}
        {showAbandonWarning && (
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,22,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAbandonWarning(false)}
          >
            <div
              className="pixel-border-crimson fade-in"
              style={{ background: 'var(--panel)', padding: '32px 28px', maxWidth: '340px', width: '100%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '18px', marginBottom: '14px' }}>⚠</div>
              <div style={{ fontSize: '9px', color: 'var(--crimson)', letterSpacing: '2px', marginBottom: '12px' }}>ABANDON QUEST?</div>
              <div style={{ fontSize: '8px', color: 'var(--text-dim)', lineHeight: '2.2', marginBottom: '24px' }}>
                You will forfeit the +5 XP bonus.<br />Your progress will not be saved.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="pixel-btn pixel-btn-gold" onClick={() => setShowAbandonWarning(false)} style={{ flex: 2, fontSize: '8px' }}>
                  STAY FOCUSED
                </button>
                <button className="pixel-btn pixel-btn-crimson" onClick={onClose} style={{ flex: 1, fontSize: '8px' }}>
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
