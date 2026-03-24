import type { Difficulty, Category } from './supabase'

export interface TemplateTask {
  title: string
  difficulty: Difficulty
  category: Category
  description?: string
}

export interface QuestTemplate {
  id: string
  name: string
  icon: string
  description: string
  tasks: TemplateTask[]
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    icon: '🌅',
    description: 'Start your day right',
    tasks: [
      { title: 'Meditate 10 min', difficulty: 'easy', category: 'daily' },
      { title: 'Journal entry', difficulty: 'easy', category: 'daily' },
      { title: 'Plan the day', difficulty: 'easy', category: 'daily' },
      { title: 'Exercise or stretch', difficulty: 'medium', category: 'daily' },
    ],
  },
  {
    id: 'deep-work',
    name: 'Deep Work Block',
    icon: '🧠',
    description: '90-min undistracted flow',
    tasks: [
      { title: 'Silence all notifications', difficulty: 'easy', category: 'daily' },
      { title: '90-min focus session', difficulty: 'hard', category: 'combat' },
      { title: 'Review + write debrief', difficulty: 'easy', category: 'daily' },
    ],
  },
  {
    id: 'code-review',
    name: 'Code Review Sprint',
    icon: '⚔',
    description: 'Ship quality code fast',
    tasks: [
      { title: 'Pull latest changes', difficulty: 'easy', category: 'arcane' },
      { title: 'Review open PRs', difficulty: 'medium', category: 'arcane' },
      { title: 'Write unit tests', difficulty: 'hard', category: 'arcane' },
      { title: 'Update documentation', difficulty: 'medium', category: 'arcane' },
    ],
  },
  {
    id: 'inbox-zero',
    name: 'Inbox Zero',
    icon: '📜',
    description: 'Clear the communication backlog',
    tasks: [
      { title: 'Process all emails', difficulty: 'medium', category: 'daily' },
      { title: 'Respond to DMs', difficulty: 'easy', category: 'daily' },
      { title: 'Update task tracker', difficulty: 'easy', category: 'daily' },
    ],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    icon: '🏆',
    description: 'Reflect and plan ahead',
    tasks: [
      { title: 'Review last week wins', difficulty: 'easy', category: 'daily' },
      { title: 'Identify blockers + lessons', difficulty: 'medium', category: 'daily' },
      { title: 'Set goals for next week', difficulty: 'medium', category: 'daily' },
      { title: 'Update habit tracker', difficulty: 'easy', category: 'daily' },
    ],
  },
  {
    id: 'health-boost',
    name: 'Health Boost',
    icon: '💪',
    description: 'Body and mind restoration',
    tasks: [
      { title: 'Drink 8 glasses of water', difficulty: 'easy', category: 'daily' },
      { title: '30-min workout', difficulty: 'medium', category: 'daily' },
      { title: 'Cook a healthy meal', difficulty: 'medium', category: 'daily' },
      { title: 'Wind-down + sleep by 10pm', difficulty: 'hard', category: 'daily' },
    ],
  },
]
