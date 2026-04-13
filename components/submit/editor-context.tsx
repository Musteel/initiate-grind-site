'use client'

import {
  createContext, useContext, useReducer, useCallback,
  type ReactNode,
} from 'react'
import type { DifficultyLevel, GamePhase, VideoSourceType } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface OptionDraft {
  id:                  string   // temp client-side id
  label:               string
  is_correct:          boolean
  explanation:         string
  outcome_video_type?: VideoSourceType
  outcome_video_ref?:  string
}

export interface EditorState {
  // Step tracker
  step: 1 | 2 | 3 | 4

  // Saved puzzle id (set after first save)
  savedPuzzleId: string | null

  // Step 1 — Metadata
  title:       string
  description: string
  difficulty:  DifficultyLevel
  game_phase:  GamePhase | ''
  hero_tags:   string[]
  mechanic_tags: string[]

  // Step 2 — Intro video
  intro_video_type: VideoSourceType
  intro_video_ref:  string
  intro_pause_at:   number | ''

  // Step 2 — Shared outcome video (fallback)
  outcome_video_type: VideoSourceType | ''
  outcome_video_ref:  string

  // Step 2 — Question
  question_text: string
  explanation:   string

  // Step 3 — Options
  options: OptionDraft[]

  // Submission state
  submitting: boolean
  submitError: string | null
}

type EditorAction =
  | { type: 'SET_STEP';         payload: 1 | 2 | 3 | 4 }
  | { type: 'SET_SAVED_ID';     payload: string }
  | { type: 'SET_FIELD';        payload: { field: keyof EditorState; value: string | number | boolean | string[] | VideoSourceType | GamePhase | null } }
  | { type: 'SET_HERO_TAGS';    payload: string[] }
  | { type: 'SET_MECHANIC_TAGS'; payload: string[] }
  | { type: 'ADD_OPTION' }
  | { type: 'UPDATE_OPTION';    payload: { id: string; field: keyof OptionDraft; value: string | boolean | VideoSourceType | undefined } }
  | { type: 'REMOVE_OPTION';    payload: string }
  | { type: 'REORDER_OPTIONS';  payload: OptionDraft[] }
  | { type: 'SET_SUBMITTING';   payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'RESET' }

// ─────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────

function makeOption(): OptionDraft {
  return {
    id:          crypto.randomUUID(),
    label:       '',
    is_correct:  false,
    explanation: '',
  }
}

const INITIAL_STATE: EditorState = {
  step:           1,
  savedPuzzleId:  null,
  title:          '',
  description:    '',
  difficulty:     'intermediate',
  game_phase:     '',
  hero_tags:      [],
  mechanic_tags:  [],
  intro_video_type: 'youtube',
  intro_video_ref:  '',
  intro_pause_at:   '',
  outcome_video_type: '',
  outcome_video_ref:  '',
  question_text:  '',
  explanation:    '',
  options:        [makeOption(), makeOption()],
  submitting:     false,
  submitError:    null,
}

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload }
    case 'SET_SAVED_ID':
      return { ...state, savedPuzzleId: action.payload }
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.value }
    case 'SET_HERO_TAGS':
      return { ...state, hero_tags: action.payload }
    case 'SET_MECHANIC_TAGS':
      return { ...state, mechanic_tags: action.payload }
    case 'ADD_OPTION':
      if (state.options.length >= 4) return state
      return { ...state, options: [...state.options, makeOption()] }
    case 'UPDATE_OPTION':
      return {
        ...state,
        options: state.options.map((o) =>
          o.id === action.payload.id
            ? { ...o, [action.payload.field]: action.payload.value }
            : o
        ),
      }
    case 'REMOVE_OPTION':
      if (state.options.length <= 2) return state
      return { ...state, options: state.options.filter((o) => o.id !== action.payload) }
    case 'REORDER_OPTIONS':
      return { ...state, options: action.payload }
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload }
    case 'SET_SUBMIT_ERROR':
      return { ...state, submitError: action.payload }
    case 'RESET':
      return INITIAL_STATE
    default:
      return state
  }
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

interface EditorContextValue {
  state:    EditorState
  dispatch: React.Dispatch<EditorAction>
  setField: (field: keyof EditorState, value: string | number | boolean | string[] | VideoSourceType | GamePhase | null) => void
  goToStep: (step: 1 | 2 | 3 | 4) => void
  // Derived helpers
  isStep1Valid: boolean
  isStep2Valid: boolean
  isStep3Valid: boolean
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const setField = useCallback((field: keyof EditorState, value: string | number | boolean | string[] | VideoSourceType | GamePhase | null) => {
    dispatch({ type: 'SET_FIELD', payload: { field, value } })
  }, [])

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [])

  const isStep1Valid =
    state.title.trim().length >= 5 &&
    !!state.difficulty

  const isStep2Valid =
    !!state.intro_video_ref.trim() &&
    !!state.question_text.trim()

  const isStep3Valid =
    state.options.length >= 2 &&
    state.options.every((o) => o.label.trim().length > 0) &&
    state.options.some((o) => o.is_correct)

  return (
    <EditorContext.Provider value={{ state, dispatch, setField, goToStep, isStep1Valid, isStep2Valid, isStep3Valid }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>')
  return ctx
}

// ─────────────────────────────────────────────────────────────
// Export makeOption for use outside the context
// ─────────────────────────────────────────────────────────────
export { makeOption }