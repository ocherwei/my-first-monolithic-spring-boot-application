export interface GameState {
  grass: number    // 0-100
  wool: number     // 0-100
  gold: number
  sheep: number
}

export interface Actions {
  type: 'grassDecay' | 'woolGrow' | 'shear' | 'buySheep' | 'tick'
}

export const initialState: GameState = {
  grass: 100,
  wool: 0,
  gold: 10,
  sheep: 1,
}

export function grassDecay(state: GameState): GameState {
  const deduction = 10 + Math.max(0, state.sheep - 1) * 5
  return { ...state, grass: Math.max(0, state.grass - deduction) }
}

export function woolGrow(state: GameState): GameState {
  if (state.wool >= 100) {
    // Shear trigger: reset wool, award gold
    return {
      ...state,
      wool: 0,
      gold: state.gold + 5 * state.sheep,
    }
  }
  return { ...state, wool: Math.min(100, state.wool + state.sheep) }
}

export function buySheep(state: GameState): GameState | null {
  if (state.gold < 15) return null
  return { ...state, gold: state.gold - 15, sheep: state.sheep + 1 }
}

/** Advance all timers by a given amount (seconds). */
export function tick(state: GameState, seconds: number): GameState {
  let s = state
  // Wool grows 1% * sheep per second
  for (let i = 0; i < seconds; i++) {
    s = woolGrow(s)
  }
  // Grass decays 10% + 5% per extra sheep per 5 minutes
  const grassTicks = Math.floor(seconds / 300)
  for (let i = 0; i < grassTicks; i++) {
    s = grassDecay(s)
  }
  return s
}
