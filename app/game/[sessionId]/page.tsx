'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Player, Task, Taunt, Difficulty } from '@/lib/supabase'
import Leaderboard from '@/components/Leaderboard'
import TaskList from '@/components/TaskList'
import TauntFeed from '@/components/TauntFeed'
import AddTaskModal from '@/components/AddTaskModal'
import TauntModal from '@/components/TauntModal'
import XpFloater from '@/components/XpFloater'

interface XpEvent { id: number; amount: number }

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()

  const [players, setPlayers] = useState<Player[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taunts, setTaunts] = useState<Taunt[]>([])
  const [myPlayerId, setMyPlayerId] = useState('')
  const [myPlayerName, setMyPlayerName] = useState('')
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [showTaunt, setShowTaunt] = useState(false)
  const [loading, setLoading] = useState(true)
  const xpCounter = useRef(0)

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/session/${sessionId}`)
    if (!res.ok) return
    const data = await res.json()
    setPlayers(data.players)
    setTasks(data.tasks)
    setTaunts(data.taunts)
  }, [sessionId])

  useEffect(() => {
    const id = localStorage.getItem('pw_player_id')
    const name = localStorage.getItem('pw_player_name')
    const sid = localStorage.getItem('pw_session_id')

    if (!id || !name || sid !== sessionId) {
      router.push('/')
      return
    }
    setMyPlayerId(id)
    setMyPlayerName(name)
    fetchSession().then(() => setLoading(false))

    const interval = setInterval(fetchSession, 8000)
    return () => clearInterval(interval)
  }, [sessionId, router, fetchSession])

  const handleCompleteTask = async (taskId: string, xpGain: number) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t))
    setPlayers(prev => prev.map(p =>
      p.id === myPlayerId ? { ...p, xp: p.xp + xpGain } : p
    ).sort((a, b) => b.xp - a.xp))

    const evId = xpCounter.current++
    setXpEvents(prev => [...prev, { id: evId, amount: xpGain }])
    setTimeout(() => setXpEvents(prev => prev.filter(e => e.id !== evId)), 1300)

    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH' })
    fetchSession()
  }

  const handleAddTask = async (title: string, difficulty: Difficulty) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: myPlayerId, session_id: sessionId, title, difficulty }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [...prev, task])
    }
    setShowAddTask(false)
  }

  const handleTaunt = async (message: string) => {
    const res = await fetch('/api/taunts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, from_name: myPlayerName, message }),
    })
    if (res.ok) {
      const taunt = await res.json()
      setTaunts(prev => [taunt, ...prev].slice(0, 10))
    }
    setShowTaunt(false)
  }

  const myTasks = tasks.filter(t => t.player_id === myPlayerId)
  const myPlayer = players.find(p => p.id === myPlayerId)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glow-green pulse-glow" style={{ fontSize: '14px', letterSpacing: '3px' }}>
          LOADING...
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--panel)',
          borderBottom: '2px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <span className="glow-green" style={{ fontSize: '12px', letterSpacing: '2px' }}>
            PRODUCTIVITY WARS
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '8px', marginLeft: '12px' }}>
            SESSION: {sessionId.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {myPlayer && myPlayer.streak > 0 && (
            <span style={{ fontSize: '8px', color: 'var(--neon-yellow)' }}>
              🔥 {myPlayer.streak}d STREAK
            </span>
          )}
          <span style={{ fontSize: '8px', color: 'var(--neon-cyan)' }}>
            {myPlayerName.toUpperCase()}
          </span>
          <button
            className="pixel-btn pixel-btn-gray"
            onClick={() => { localStorage.clear(); router.push('/') }}
            style={{ fontSize: '7px', padding: '6px 10px' }}
          >
            QUIT
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
          gridTemplateRows: '1fr auto',
          gap: '0',
          overflow: 'hidden',
        }}
      >
        {/* Left — Leaderboard */}
        <div
          style={{
            borderRight: '2px solid var(--border)',
            overflow: 'auto',
            gridRow: '1 / 3',
          }}
        >
          <Leaderboard players={players} myPlayerId={myPlayerId} />
        </div>

        {/* Right top — Tasks */}
        <div style={{ overflow: 'auto', padding: '20px', position: 'relative' }}>
          <XpFloater events={xpEvents} />
          <TaskList
            tasks={myTasks}
            onComplete={handleCompleteTask}
            onAddTask={() => setShowAddTask(true)}
          />
        </div>

        {/* Right bottom — Taunt feed + button */}
        <div
          style={{
            borderTop: '2px solid var(--border)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--panel)',
          }}
        >
          <button
            className="pixel-btn pixel-btn-magenta shake"
            onClick={() => setShowTaunt(true)}
            style={{ fontSize: '8px', flexShrink: 0 }}
          >
            ⚡ TAUNT
          </button>
          <TauntFeed taunts={taunts} />
        </div>
      </div>

      {/* Modals */}
      {showAddTask && (
        <AddTaskModal onAdd={handleAddTask} onClose={() => setShowAddTask(false)} />
      )}
      {showTaunt && (
        <TauntModal onSend={handleTaunt} onClose={() => setShowTaunt(false)} />
      )}
    </div>
  )
}
