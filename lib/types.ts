/**
 * Common TypeScript type definitions for PickCrown
 */

// Database table types
export interface Pool {
  id: string
  name: string
  event_id: string
  created_at: string
  updated_at?: string
  commissioner_email?: string
  is_private?: boolean
}

export interface Event {
  id: string
  name: string
  start_time: string
  status: 'upcoming' | 'in_progress' | 'completed'
  created_at: string
  updated_at?: string
}

export interface Category {
  id: string
  event_id: string
  name: string
  points: number
  order: number
  created_at: string
}

export interface CategoryOption {
  id: string
  category_id: string
  text: string
  order: number
  created_at: string
}

export interface PoolEntry {
  id: string
  pool_id: string
  entry_name: string
  email: string
  created_at: string
  updated_at?: string
}

export interface Pick {
  id: string
  entry_id: string
  category_id: string
  option_id?: string
  custom_text?: string
  is_correct?: boolean
  created_at: string
  updated_at?: string
}

export interface Standing {
  id?: string
  entry_id?: string
  entry_name?: string
  display_name?: string
  email: string
  total_points?: number
  points?: number
  correct_picks?: number
  total_picks?: number
  max_possible?: number
  max_possible_points?: number
  rank?: number
}

export interface Profile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
}

// API request/response types
export interface CreatePoolRequest {
  name: string
  event_id: string
  commissioner_email?: string
  is_private?: boolean
}

export interface UpdatePoolRequest {
  id: string
  name?: string
  commissioner_email?: string
  is_private?: boolean
}

export interface CreateEventRequest {
  name: string
  start_time: string
  status?: 'upcoming' | 'in_progress' | 'completed'
}

export interface UpdateEventRequest {
  id: string
  name?: string
  start_time?: string
  status?: 'upcoming' | 'in_progress' | 'completed'
}

export interface CreateCategoryRequest {
  event_id: string
  name: string
  points: number
  order: number
}

export interface ApiErrorResponse {
  error: string
}

export interface ApiSuccessResponse {
  success: boolean
}

// Pool helpers types
export interface PoolPublicInfo {
  eventName?: string
  eventDate?: string
  eventStatus?: string
}

export interface PodiumEntry {
  entry_name: string
  total_points: number
  position: number
  medal: string
}
