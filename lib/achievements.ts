export interface AchievementDef {
  key: string
  label: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'first_blood',
    label: 'FIRST BLOOD',
    description: 'Complete your very first quest',
    icon: '⚔️',
  },
  {
    key: 'grind_mode',
    label: 'GRIND MODE',
    description: 'Complete 10 quests in a single session',
    icon: '💀',
  },
  {
    key: 'streak_3',
    label: 'ON FIRE',
    description: 'Reach a 3-day streak',
    icon: '🔥',
  },
  {
    key: 'streak_7',
    label: 'UNSTOPPABLE',
    description: 'Reach a 7-day streak',
    icon: '⚡',
  },
  {
    key: 'hard_labor',
    label: 'HARD LABOR',
    description: 'Complete 5 HARD difficulty quests',
    icon: '🪨',
  },
  {
    key: 'focus_master',
    label: 'FOCUS MASTER',
    description: 'Complete 5 Pomodoro sessions',
    icon: '🍅',
  },
  {
    key: 'social_menace',
    label: 'SOCIAL MENACE',
    description: 'Send 10 taunts',
    icon: '😈',
  },
  {
    key: 'legend_rank',
    label: 'LEGENDARY',
    description: 'Reach the Legend rank (2000 XP)',
    icon: '👑',
  },
  {
    key: 'class_master',
    label: 'CLASS MASTER',
    description: 'Complete 20 quests of your class affinity',
    icon: '🏆',
  },
]

export function getAchievementDef(key: string): AchievementDef {
  return ACHIEVEMENTS.find(a => a.key === key) ?? {
    key,
    label: key.toUpperCase().replace(/_/g, ' '),
    description: '',
    icon: '🎖️',
  }
}
