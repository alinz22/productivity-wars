'use client'

type OscType = OscillatorType

function playTone(
  freq: number,
  duration: number,
  type: OscType = 'square',
  gain = 0.15,
  startTime?: number
): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    gainNode.gain.setValueAtTime(gain, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    const t = startTime ?? ctx.currentTime
    osc.start(t)
    osc.stop(t + duration)
    osc.onended = () => ctx.close()
  } catch {
    // Audio not supported or blocked
  }
}

function playSequence(notes: [number, number, number?][], gapMs = 60) {
  notes.forEach(([freq, dur, delay], i) => {
    setTimeout(() => playTone(freq, dur, 'square', delay ?? 0.12), i * gapMs)
  })
}

export function playTaskComplete() {
  playSequence([
    [523, 0.08],
    [659, 0.08],
    [784, 0.12],
    [1047, 0.18],
  ], 70)
}

export function playLevelUp() {
  playSequence([
    [262, 0.06],
    [330, 0.06],
    [392, 0.06],
    [524, 0.06],
    [660, 0.06],
    [784, 0.06],
    [1048, 0.2],
  ], 50)
}

export function playTauntReceived() {
  playSequence([
    [200, 0.06],
    [150, 0.1],
  ], 80)
}

export function playPomodoroDone() {
  playSequence([
    [880, 0.08],
    [880, 0.08],
    [880, 0.08],
    [1108, 0.22],
  ], 90)
}

export function playAchievement() {
  playSequence([
    [392, 0.06],
    [523, 0.06],
    [659, 0.06],
    [784, 0.06],
    [1047, 0.25],
  ], 60)
}

export function playJoinSession() {
  playSequence([
    [440, 0.06],
    [660, 0.12],
  ], 80)
}
