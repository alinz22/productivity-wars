import type { Difficulty, Category, PlayerClass } from '@/lib/supabase'
import { XP_VALUES } from '@/lib/supabase'

export interface ClassDefinition {
  id: PlayerClass
  name: string
  icon: string
  lore: string
  affinity: Category
  color: string
}

export const CLASSES: ClassDefinition[] = [
  {
    id: 'warrior',
    name: 'WARRIOR',
    icon: '⚔️',
    lore: 'Brute force. Tackle the hardest tasks head-on. 2x XP on COMBAT quests.',
    affinity: 'combat',
    color: 'var(--neon-magenta)',
  },
  {
    id: 'mage',
    name: 'MAGE',
    icon: '🔮',
    lore: 'Knowledge is power. Master learning and creation. 2x XP on ARCANE quests.',
    affinity: 'arcane',
    color: 'var(--neon-cyan)',
  },
  {
    id: 'rogue',
    name: 'ROGUE',
    icon: '🗡️',
    lore: 'Strike fast, move silent. Get things done quietly. 2x XP on STEALTH quests.',
    affinity: 'stealth',
    color: 'var(--neon-green)',
  },
  {
    id: 'cleric',
    name: 'CLERIC',
    icon: '✨',
    lore: 'The backbone of every party. Support your team. 2x XP on SUPPORT quests.',
    affinity: 'support',
    color: 'var(--neon-yellow)',
  },
]

export const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'combat',  label: 'COMBAT',  icon: '⚔️',  color: 'var(--neon-magenta)' },
  { id: 'arcane',  label: 'ARCANE',  icon: '🔮',  color: 'var(--neon-cyan)'    },
  { id: 'stealth', label: 'STEALTH', icon: '🗡️',  color: 'var(--neon-green)'   },
  { id: 'support', label: 'SUPPORT', icon: '✨',  color: 'var(--neon-yellow)'  },
  { id: 'daily',   label: 'DAILY',   icon: '📋',  color: 'var(--text-dim)'     },
]

export const RANK_THRESHOLDS = [
  { xp: 0,    label: 'PEASANT',  color: 'var(--text-dim)' },
  { xp: 100,  label: 'SQUIRE',   color: 'var(--neon-green)' },
  { xp: 300,  label: 'KNIGHT',   color: 'var(--neon-cyan)' },
  { xp: 600,  label: 'CHAMPION', color: 'var(--neon-yellow)' },
  { xp: 1000, label: 'HERO',     color: 'var(--neon-magenta)' },
  { xp: 2000, label: 'LEGEND',   color: '#ff8800' },
  { xp: 5000, label: 'MYTHIC',   color: '#ff3300' },
]

export function getRank(xp: number) {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].xp) return RANK_THRESHOLDS[i]
  }
  return RANK_THRESHOLDS[0]
}

export function getClassDef(cls: PlayerClass): ClassDefinition {
  return CLASSES.find(c => c.id === cls) ?? CLASSES[0]
}

export function getXpForTask(
  difficulty: Difficulty,
  category: Category,
  playerClass: PlayerClass
): number {
  const base = XP_VALUES[difficulty]
  const classDef = getClassDef(playerClass)
  const bonus = classDef.affinity === category && category !== 'daily' ? 2 : 1
  return base * bonus
}
