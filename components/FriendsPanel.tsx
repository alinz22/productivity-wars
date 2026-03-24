'use client'

import { useEffect, useState } from 'react'
import { getClassDef } from '@/lib/classes'
import type { PlayerClass } from '@/lib/supabase'

interface FriendProfile {
  id: string
  username: string
  class: PlayerClass
  total_xp: number
}

interface Friendship {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester: FriendProfile
  addressee: FriendProfile
}

interface Props {
  currentUserId: string
  sessionInviteCode?: string
  onClose: () => void
}

export default function FriendsPanel({ currentUserId, sessionInviteCode, onClose }: Props) {
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [searchUsername, setSearchUsername] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    fetch('/api/friends')
      .then(r => r.json())
      .then(data => { setFriendships(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const handleAdd = async () => {
    const name = searchUsername.trim().toUpperCase()
    if (!name) return
    setAdding(true)
    setAddError('')
    setAddSuccess('')
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFriendships(prev => [...prev, data])
      setSearchUsername('')
      setAddSuccess(`Friend request sent to ${name}!`)
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setAdding(false)
    }
  }

  const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
    const res = await fetch(`/api/friends/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setFriendships(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    }
  }

  const handleRemove = async (id: string) => {
    await fetch(`/api/friends/${id}`, { method: 'DELETE' })
    setFriendships(prev => prev.filter(f => f.id !== id))
  }

  const handleCopyInvite = () => {
    if (sessionInviteCode) {
      navigator.clipboard.writeText(sessionInviteCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 1500)
    }
  }

  const accepted = friendships.filter(f => f.status === 'accepted')
  const incoming = friendships.filter(f => f.status === 'pending' && f.addressee.id === currentUserId)
  const outgoing = friendships.filter(f => f.status === 'pending' && f.requester.id === currentUserId)

  const getFriendProfile = (f: Friendship): FriendProfile =>
    f.requester.id === currentUserId ? f.addressee : f.requester

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-cyan fade-in"
        style={{
          background: 'var(--panel)',
          padding: '28px',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 className="glow-cyan" style={{ fontSize: '10px', letterSpacing: '2px' }}>
            👥 FRIENDS
          </h2>
          <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ fontSize: '7px', padding: '6px 10px' }}>
            ✕
          </button>
        </div>

        {/* Add friend */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: 'var(--neon-cyan)', fontSize: '8px', marginBottom: '8px', letterSpacing: '2px' }}>
            ADD FRIEND
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="pixel-border" style={{ flex: 1 }}>
              <input
                className="pixel-input"
                placeholder="USERNAME..."
                value={searchUsername}
                onChange={e => setSearchUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                maxLength={16}
                style={{ fontSize: '9px' }}
              />
            </div>
            <button
              className="pixel-btn pixel-btn-cyan"
              onClick={handleAdd}
              disabled={adding}
              style={{ fontSize: '8px', opacity: adding ? 0.7 : 1 }}
            >
              ADD
            </button>
          </div>
          {addError && <div className="glow-mag" style={{ marginTop: '6px', fontSize: '7px' }}>!! {addError} !!</div>}
          {addSuccess && <div style={{ marginTop: '6px', fontSize: '7px', color: 'var(--neon-green)' }}>{addSuccess}</div>}
        </div>

        {/* Invite to session */}
        {sessionInviteCode && (
          <div
            className="pixel-border"
            style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', marginBottom: '20px' }}
          >
            <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '6px' }}>INVITE TO THIS SESSION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--neon-cyan)', letterSpacing: '4px' }}>
                {sessionInviteCode}
              </span>
              <button
                className="pixel-btn pixel-btn-dark"
                onClick={handleCopyInvite}
                style={{ fontSize: '7px', padding: '6px 10px' }}
              >
                {copiedCode ? 'COPIED!' : 'COPY'}
              </button>
            </div>
          </div>
        )}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--neon-yellow)', fontSize: '8px', marginBottom: '8px', letterSpacing: '1px' }}>
              INCOMING REQUESTS ({incoming.length})
            </div>
            {incoming.map(f => {
              const p = f.requester
              const cls = getClassDef(p.class)
              return (
                <div key={f.id} className="pixel-border" style={{ background: 'var(--panel)', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{cls.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '8px', color: cls.color }}>{p.username}</div>
                    <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>{cls.name} · {p.total_xp} XP</div>
                  </div>
                  <button className="pixel-btn pixel-btn-green" onClick={() => handleRespond(f.id, 'accepted')} style={{ fontSize: '7px', padding: '5px 8px' }}>✓</button>
                  <button className="pixel-btn pixel-btn-gray" onClick={() => handleRespond(f.id, 'rejected')} style={{ fontSize: '7px', padding: '5px 8px' }}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Friends list */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: 'var(--neon-green)', fontSize: '8px', marginBottom: '8px', letterSpacing: '1px' }}>
            FRIENDS ({accepted.length})
          </div>
          {loading && <div style={{ color: 'var(--text-dim)', fontSize: '8px' }}>Loading...</div>}
          {!loading && accepted.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: '8px', lineHeight: '2' }}>
              No friends yet. Add one above!
            </div>
          )}
          {accepted.map(f => {
            const p = getFriendProfile(f)
            const cls = getClassDef(p.class)
            return (
              <div key={f.id} className="pixel-border" style={{ background: 'var(--panel)', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{cls.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '8px', color: cls.color }}>{p.username}</div>
                  <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>{cls.name} · {p.total_xp} XP</div>
                </div>
                <button className="pixel-btn pixel-btn-gray" onClick={() => handleRemove(f.id)} style={{ fontSize: '7px', padding: '5px 8px' }}>REMOVE</button>
              </div>
            )
          })}
        </div>

        {/* Outgoing requests */}
        {outgoing.length > 0 && (
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '8px', letterSpacing: '1px' }}>
              PENDING ({outgoing.length})
            </div>
            {outgoing.map(f => {
              const p = f.addressee
              const cls = getClassDef(p.class)
              return (
                <div key={f.id} className="pixel-border" style={{ background: 'var(--panel)', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
                  <span>{cls.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '8px', color: cls.color }}>{p.username}</div>
                    <div style={{ fontSize: '7px', color: 'var(--text-dim)' }}>Pending...</div>
                  </div>
                  <button className="pixel-btn pixel-btn-gray" onClick={() => handleRemove(f.id)} style={{ fontSize: '7px', padding: '5px 8px' }}>CANCEL</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
