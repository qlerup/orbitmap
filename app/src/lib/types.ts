export type ItemType = 'idea' | 'bug' | 'feature'
export type ItemStatus = 'backlog' | 'planned' | 'in_progress' | 'done'
export type ItemPriority = 'low' | 'medium' | 'high'

export interface TrackedApp {
  id: string
  name: string
  description: string | null
  color: string
}

export interface AppWithStats extends TrackedApp {
  bug_count: number
  idea_count: number
  feature_count: number
  in_progress_count: number
  open_count: number
  done_count: number
  total_count: number
}

export interface RoadmapItem {
  id: string
  app_id: string
  type: ItemType
  title: string
  description: string | null
  status: ItemStatus
  priority: ItemPriority
  position: number
  created_at: string
}

export const STATUS_ORDER: ItemStatus[] = ['backlog', 'planned', 'in_progress', 'done']

export const STATUS_LABELS: Record<ItemStatus, string> = {
  backlog: 'Backlog',
  planned: 'Planlagt',
  in_progress: 'I gang',
  done: 'Fuldført',
}

export const TYPE_LABELS: Record<ItemType, string> = {
  idea: 'Ændring',
  bug: 'Fejl',
  feature: 'Feature',
}

export const PRIORITY_LABELS: Record<ItemPriority, string> = {
  low: 'Lav',
  medium: 'Mellem',
  high: 'Høj',
}

// Fast palette til app-kort - vælges i UI'et frem for fri farvevælger
export const APP_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#64748b', // slate
]
