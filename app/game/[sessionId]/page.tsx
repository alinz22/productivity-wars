'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Player, Task, Taunt, Difficulty, Category, Goal } from '@/lib/supabase'
import { getXpForTask, getRank, getClassDef } from '@/lib/classes'
import type { PlayerClass } from '@/lib/supabase'
import Leaderboard from '@/components/Leaderboard'
import TaskList from '@/components/TaskList'
import TauntFeed from '@/components/TauntFeed'
import AddTaskModal from '@/components/AddTaskModal'
import TauntModal from '@/components/TauntModal'
import XpFloater from '@/components/XpFloater'
import AchievementToast from '@/components/AchievementToast'
import PomodoroTimer from '@/components/PomodoroTimer'
import FriendsPanel from '@/components/FriendsPanel'
import GoalsTab from '@/components/GoalsTab'
import HabitsTab from '@/components/HabitsTab'
import { playTaskComplete, playAchievement, playPomodoroDone, playTauntReceived } from '@/lib/sounds'

interface XpEvent { id: number; amount: number }
interface AchievementEvent { id: number; key: string; label: string }

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()

  const [players, setPlayers] = useState<Player[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taunts, setTaunts] = useState<Taunt[]>([])
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([])
  const [achievementEvents, setAchievementEvents] = useState<AchievementEvent[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [showTaunt, setShowTaunt] = useState(false)
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [activePomodoroId, setActivePomodoroId] = useState<string | null>(null)
  const [showFriends, setShowFriends] = useState(false)
  const [sessionInviteCode, setSessionInviteCode] = useState('')
  const [authUserId, setAuthUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [notInSession, setNotInSession] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [activeTab, setActiveTab] = useState<'quests' | 'goals' | 'habits'>('quests')
  const [goals, setGoals] = useState<Goal[]>([])
  const xpCounter = useRef(0)
  const achCounter = useRef(0)

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/session/${sessionId}`)
    if (!res.ok) return null
    const data = await res.json()
    setPlayers(data.players)
    setTasks(data.tasks)
    setTaunts(data.taunts)
    if (data.myPlayer) setMyPlayer(data.myPlayer)
    return data
  }, [sessionId])

  // Auth check + initial load
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setAuthUserId(user.id)

      fetchSession().then(data => {
        if (!data) { router.push('/'); return }
        if (!data.myPlayer) {
          setNotInSession(true)
        }
        setLoading(false)
      })

      // Fetch invite code
      fetch(`/api/session/${sessionId}/invite`)
        .then(r => r.json())
        .then(d => { if (d.invite_code) setSessionInviteCode(d.invite_code) })
    })
  }, [sessionId, router, fetchSession])

  // Supabase Realtime subscriptions
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${sessionId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setPlayers(prev => [...prev, payload.new as Player].sort((a, b) => b.xp - a.xp))
          } else if (payload.eventType === 'UPDATE') {
            setPlayers(prev =>
              prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
                .sort((a, b) => b.xp - a.xp)
            )
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter: `session_id=eq.${sessionId}` },
        payload => {
          setTasks(prev => {
            const exists = prev.find(t => t.id === payload.new.id)
            return exists ? prev : [...prev, payload.new as Task]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `session_id=eq.${sessionId}` },
        payload => {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'taunts', filter: `session_id=eq.${sessionId}` },
        payload => {
          setTaunts(prev => [payload.new as Taunt, ...prev].slice(0, 10))
          // Play sound only for taunts from others
          if (myPlayer && (payload.new as Taunt).from_name !== myPlayer.name) {
            playTauntReceived()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'achievements' },
        payload => {
          // Show achievement toast for current player
          if (myPlayer?.user_id && payload.new.user_id === myPlayer.user_id) {
            playAchievement()
            const evId = achCounter.current++
            const def = getAchievementLabel(payload.new.achievement_key)
            setAchievementEvents(prev => [...prev, { id: evId, key: payload.new.achievement_key, label: def }])
            setTimeout(() => setAchievementEvents(prev => prev.filter(e => e.id !== evId)), 4000)
          }
        }
      )
      .subscribe(status => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, myPlayer?.user_id])

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || !myPlayer) return

    const xpGain = getXpForTask(
      task.difficulty as Difficulty,
      (task.category ?? 'daily') as Category,
      (myPlayer.class ?? 'warrior') as PlayerClass
    )

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t))
    setMyPlayer(prev => prev ? { ...prev, xp: prev.xp + xpGain } : prev)
    setPlayers(prev =>
      prev.map(p => p.id === myPlayer.id ? { ...p, xp: p.xp + xpGain } : p)
        .sort((a, b) => b.xp - a.xp)
    )

    playTaskComplete()

    const evId = xpCounter.current++
    setXpEvents(prev => [...prev, { id: evId, amount: xpGain }])
    setTimeout(() => setXpEvents(prev => prev.filter(e => e.id !== evId)), 1300)

    const res = await fetch(`/api/tasks/${taskId}`, { method: 'PATCH' })
    if (res.ok) {
      const data = await res.json()
      // Reconcile with server response
      if (data.player) {
        setPlayers(prev =>
          prev.map(p => p.id === data.player.id ? { ...p, ...data.player } : p)
            .sort((a, b) => b.xp - a.xp)
        )
        if (data.player.id === myPlayer.id) setMyPlayer(data.player)
      }
    }
  }

  const handleAddTask = async (title: string, difficulty: Difficulty, category: Category, goalId: string | null) => {
    if (!myPlayer) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: myPlayer.id,
        session_id: sessionId,
        title,
        difficulty,
        category,
        goal_id: goalId ?? null,
      }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => {
        const exists = prev.find(t => t.id === task.id)
        return exists ? prev : [...prev, task]
      })
    }
    setShowAddTask(false)
  }

  const handleStartPomodoro = async (task: Task) => {
    if (!myPlayer) return
    setFocusTask(task)
    const res = await fetch('/api/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, player_id: myPlayer.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setActivePomodoroId(data.id)
    }
  }

  const handlePomodoroComplete = async (taskId: string) => {
    if (!myPlayer || !activePomodoroId) return
    const res = await fetch('/api/pomodoro', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pomodoro_id: activePomodoroId, player_id: myPlayer.id, task_id: taskId }),
    })
    if (res.ok) {
      setActivePomodoroId(null)
      playPomodoroDone()
      const evId = xpCounter.current++
      setXpEvents(prev => [...prev, { id: evId, amount: 5 }])
      setTimeout(() => setXpEvents(prev => prev.filter(e => e.id !== evId)), 1300)
    }
  }

  const handleTaunt = async (message: string) => {
    if (!myPlayer) return
    const res = await fetch('/api/taunts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, from_name: myPlayer.name, message }),
    })
    if (res.ok) {
      const taunt = await res.json()
      setTaunts(prev => {
        const exists = prev.find(t => t.id === taunt.id)
        return exists ? prev : [taunt, ...prev].slice(0, 10)
      })
    }
    setShowTaunt(false)
  }

  const copyInviteCode = async () => {
    const res = await fetch(`/api/session/${sessionId}`)
    const data = await res.json()
    const code = data.players?.[0]?.session_id ? sessionId : sessionId
    // Get invite code from session data
    const sessionRes = await fetch(`/api/session/${sessionId}/invite`)
    const sessionData = await sessionRes.json()
    if (sessionData.invite_code) {
      navigator.clipboard.writeText(sessionData.invite_code)
    }
  }

  const myTasks = myPlayer ? tasks.filter(t => t.player_id === myPlayer.id) : []
  const rank = myPlayer ? getRank(myPlayer.xp) : null
  const classDef = myPlayer ? getClassDef(myPlayer.class as PlayerClass) : null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glow-gold pulse-glow" style={{ fontSize: '14px', letterSpacing: '3px' }}>LOADING...</div>
      </div>
    )
  }

  if (notInSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="glow-crimson" style={{ fontSize: '10px' }}>NOT IN THIS SESSION</div>
        <div style={{ color: 'var(--text-dim)', fontSize: '8px' }}>You have not joined this battle yet.</div>
        <button className="pixel-btn pixel-btn-green" onClick={() => router.push('/')} style={{ fontSize: '8px' }}>
          ← BACK TO LOBBY
        </button>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className="glow-gold" style={{ fontSize: '12px', letterSpacing: '2px' }}>
            ⚔ PROD WARS
          </span>
          <InviteCodeDisplay sessionId={sessionId} />
          {isLive && (
            <span style={{ fontSize: '8px', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="pulse-glow">●</span> LIVE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {classDef && myPlayer && (
            <span style={{ fontSize: '9px', color: classDef.color }}>
              {classDef.icon} {myPlayer.name}
            </span>
          )}
          {rank && (
            <span style={{ fontSize: '8px', color: rank.color, opacity: 0.9 }}>
              {rank.label}
            </span>
          )}
          {myPlayer && myPlayer.streak > 0 && (
            <span style={{ fontSize: '9px', color: 'var(--ember)' }}>
              🔥 {myPlayer.streak}d
            </span>
          )}
          <button
            className="pixel-btn pixel-btn-silver"
            onClick={() => setShowFriends(true)}
            style={{ fontSize: '8px', padding: '7px 12px' }}
          >
            👥 FRIENDS
          </button>
          <button
            className="pixel-btn pixel-btn-gray"
            onClick={() => router.push('/')}
            style={{ fontSize: '8px', padding: '7px 12px' }}
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
          overflow: 'hidden',
        }}
      >
        {/* Left — Leaderboard */}
        <div style={{ borderRight: '2px solid var(--border)', overflow: 'auto', gridRow: '1 / 3' }}>
          <Leaderboard players={players} myPlayerId={myPlayer?.id ?? ''} />
        </div>

        {/* Right — Tabbed panel */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
            {(['quests', 'goals', 'habits'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  padding: '11px 6px',
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === tab ? 'rgba(245,200,66,0.08)' : 'transparent',
                  color: activeTab === tab ? 'var(--gold)' : 'var(--text-dim)',
                  borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
                  marginBottom: '-2px',
                  transition: 'color 0.15s',
                }}
              >
                {tab === 'quests' ? '⚔ QUESTS' : tab === 'goals' ? '🎯 GOALS' : '⚡ HABITS'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ overflow: 'auto', padding: '20px', flex: 1, position: 'relative' }}>
            <XpFloater events={xpEvents} />
            {activeTab === 'quests' && myPlayer && (
              <TaskList
                tasks={myTasks}
                myPlayer={myPlayer}
                onComplete={handleCompleteTask}
                onAddTask={() => setShowAddTask(true)}
                onFocus={handleStartPomodoro}
                activePomodoroTaskId={focusTask?.id ?? null}
              />
            )}
            {activeTab === 'goals' && (
              <GoalsTab userId={authUserId} onGoalsChange={setGoals} />
            )}
            {activeTab === 'habits' && (
              <HabitsTab userId={authUserId} />
            )}
          </div>
        </div>

        {/* Right bottom — Taunt feed */}
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
            className="pixel-btn pixel-btn-crimson"
            onClick={() => setShowTaunt(true)}
            style={{ fontSize: '8px', flexShrink: 0 }}
          >
            ⚡ TAUNT
          </button>
          <TauntFeed taunts={taunts} />
        </div>
      </div>

      {showAddTask && myPlayer && (
        <AddTaskModal
          playerClass={myPlayer.class as PlayerClass}
          goals={goals}
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}
      {showTaunt && <TauntModal onSend={handleTaunt} onClose={() => setShowTaunt(false)} />}

      {focusTask && (
        <PomodoroTimer
          taskId={focusTask.id}
          taskTitle={focusTask.title}
          onComplete={handlePomodoroComplete}
          onClose={() => setFocusTask(null)}
        />
      )}

      {showFriends && (
        <FriendsPanel
          currentUserId={authUserId}
          sessionInviteCode={sessionInviteCode}
          onClose={() => setShowFriends(false)}
        />
      )}

      {achievementEvents.map(e => (
        <AchievementToast key={e.id} label={e.label} onDone={() =>
          setAchievementEvents(prev => prev.filter(a => a.id !== e.id))
        } />
      ))}
    </div>
  )
}

function InviteCodeDisplay({ sessionId }: { sessionId: string }) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/session/${sessionId}/invite`)
      .then(r => r.json())
      .then(d => { if (d.invite_code) setCode(d.invite_code) })
  }, [sessionId])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!code) return null

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', monospace",
        color: 'var(--text-dim)',
        fontSize: '8px',
        letterSpacing: '2px',
      }}
    >
      {copied ? (
        <span style={{ color: 'var(--neon-green)' }}>COPIED!</span>
      ) : (
        <>CODE: <span style={{ color: 'var(--neon-cyan)' }}>{code}</span></>
      )}
    </button>
  )
}

function getAchievementLabel(key: string): string {
  const labels: Record<string, string> = {
    first_blood: 'FIRST BLOOD — Complete your first quest!',
    grind_mode: 'GRIND MODE — 10 quests in one session!',
    streak_3: 'ON FIRE — 3-day streak!',
    streak_7: 'UNSTOPPABLE — 7-day streak!',
    hard_labor: 'HARD LABOR — 5 hard quests!',
    focus_master: 'FOCUS MASTER — 5 Pomodoros!',
    social_menace: 'SOCIAL MENACE — 10 taunts sent!',
    legend_rank: 'LEGENDARY — Reached Legend rank!',
    class_master: 'CLASS MASTER — 20 class quests!',
  }
  return labels[key] ?? key.toUpperCase().replace(/_/g, ' ')
}
