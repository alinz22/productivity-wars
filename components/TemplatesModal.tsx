'use client'

import { useState } from 'react'
import { QUEST_TEMPLATES, type QuestTemplate } from '@/lib/templates'
import type { TaskFormData } from './AddTaskModal'
import type { PlayerClass } from '@/lib/supabase'

interface Props {
  playerClass: PlayerClass
  onImport: (tasks: TaskFormData[]) => void
  onClose: () => void
}

export default function TemplatesModal({ playerClass: _playerClass, onImport, onClose }: Props) {
  const [selected, setSelected] = useState<QuestTemplate | null>(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (!selected) return
    setImporting(true)
    const tasks: TaskFormData[] = selected.tasks.map(t => ({
      title: t.title,
      difficulty: t.difficulty,
      category: t.category,
      goalId: null,
      description: t.description ?? null,
      dueDate: null,
      priority: null,
      subtasks: [],
    }))
    onImport(tasks)
    setImporting(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="pixel-border-gold fade-in"
        style={{ background: 'var(--panel)', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 className="glow-gold" style={{ fontSize: '10px', letterSpacing: '2px' }}>📋 QUEST TEMPLATES</h2>
          <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ fontSize: '7px', padding: '5px 8px' }}>✕</button>
        </div>

        <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: '2' }}>
          Import a preset bundle of quests to jumpstart your session.
        </div>

        {/* Template grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {QUEST_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setSelected(selected?.id === tpl.id ? null : tpl)}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                cursor: 'pointer',
                border: 'none',
                background: selected?.id === tpl.id ? 'rgba(245,200,66,0.08)' : 'rgba(0,0,0,0.2)',
                padding: '14px 12px',
                textAlign: 'left',
                outline: 'none',
              }}
              className={selected?.id === tpl.id ? 'pixel-border-gold' : 'pixel-border'}
            >
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>{tpl.icon}</div>
              <div style={{ fontSize: '8px', color: 'var(--text)', marginBottom: '4px' }}>{tpl.name}</div>
              <div style={{ fontSize: '6px', color: 'var(--text-dim)', lineHeight: '1.6' }}>{tpl.description}</div>
              <div style={{ fontSize: '6px', color: 'var(--silver)', marginTop: '6px' }}>{tpl.tasks.length} quests</div>
            </button>
          ))}
        </div>

        {/* Selected template preview */}
        {selected && (
          <div className="pixel-border" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '8px', color: 'var(--gold)', marginBottom: '10px', letterSpacing: '1px' }}>
              {selected.icon} {selected.name.toUpperCase()}
            </div>
            {selected.tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < selected.tasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '7px', color: 'var(--text-dim)', flexShrink: 0 }}>·</span>
                <span style={{ fontSize: '7px', color: 'var(--text)', flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: '6px', color: 'var(--text-dim)', flexShrink: 0 }}>{t.difficulty.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="pixel-btn pixel-btn-gray" onClick={onClose} style={{ flex: 1, fontSize: '8px' }}>
            CANCEL
          </button>
          <button
            className="pixel-btn pixel-btn-gold"
            onClick={handleImport}
            disabled={!selected || importing}
            style={{ flex: 1, fontSize: '8px', opacity: (!selected || importing) ? 0.5 : 1 }}
          >
            {importing ? 'IMPORTING...' : `▶ IMPORT ${selected ? selected.tasks.length : 0} QUESTS`}
          </button>
        </div>
      </div>
    </div>
  )
}
