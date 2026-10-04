export interface GameState {
  grass: number       // 0-100 (0 = pasture empty)
  hay: number         // 0-100 (stored in silo, fed when grass = 0)
  wool: number        // 0-100
  gold: number
  sheep: number
  autoBuySheep: boolean  // auto-purchase sheep when gold >= 15
  deathCounter: number  // ticks elapsed since last sheep death (Phase 3)
}

export interface Actions {
  type: 'grassDecay' | 'woolGrow' | 'shear' | 'buySheep' | 'tick'
}

export const initialState: GameState = {
  grass: 100,
  hay: 0,
  wool: 0,
  gold: 10,
  sheep: 1,
  autoBuySheep: false,
  deathCounter: 0,
}

const GrassRegen = 9  // 9% per 2.5-min tick
const PerSheepGrassCost = 3  // 3% per sheep per tick
const PerSheepHayCost = 5  // 5% per sheep per tick (when grass = 0)
const DeathInterval = 3  // 1 sheep dies every 3 ticks (7.5 minutes)

export function grassDecay(state: GameState): GameState {
  if (state.sheep === 0) return state  // no sheep, no consumption

  // Phase 1: grass available
  if (state.grass > 0) {
    const consumption = state.sheep * PerSheepGrassCost
    // Consume first, then regenerate, then cap at 100
    const afterConsumption = Math.max(0, state.grass - consumption)
    const afterRegen = afterConsumption + GrassRegen
    const newHay = Math.max(0, state.hay)  // carry forward

    // Overflow: grass capped at 100, excess → hay (capped at 100)
    if (afterRegen >= 100) {
      const overflow = afterRegen - 100
      const cappedHay = Math.min(100, state.hay + overflow)
      return { ...state, grass: 100, hay: cappedHay, deathCounter: 0 }
    }

    // Not at 100 — no overflow, grass = afterRegen
    return { ...state, grass: afterRegen, hay: newHay, deathCounter: 0 }
  }

  // Grass is 0 — check hay
  if (state.hay > 0) {
    const consumption = state.sheep * PerSheepHayCost
    const newHay = Math.max(0, state.hay - consumption)
    const newCounter = state.deathCounter + 1

    // Hay empty — transition to death phase
    if (newHay <= 0) {
      return { ...state, hay: 0, deathCounter: newCounter }
    }

    return { ...state, hay: newHay, deathCounter: 0 }
  }

  // Phase 3: grass and hay both 0, start killing sheep
  const newCounter = state.deathCounter + 1
  if (newCounter >= DeathInterval && state.sheep > 0) {
    return { ...state, deathCounter: 0, sheep: state.sheep - 1 }
  }
  return { ...state, deathCounter: newCounter }
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

const GoldPerHayPercent = 500  // gold cost per 1% of hay

export function buyEmergencyHay(state: GameState, targetHay: number): GameState | null {
  const current = state.hay
  const needed = Math.min(targetHay, 100) - current
  if (needed <= 0) return null  // already at or above target
  const cost = needed * GoldPerHayPercent
  if (state.gold < cost) return null
  return { ...state, gold: state.gold - cost, hay: targetHay, deathCounter: 0 }
}

/** Advance all timers by a given amount (seconds). */
export function tick(state: GameState, seconds: number): GameState {
  let s = state
  // Wool grows 1% * sheep per second
  for (let i = 0; i < seconds; i++) {
    s = woolGrow(s)
  }
  // Grass/hay system: 2.5-min ticks (150 seconds)
  const grassTicks = Math.floor(seconds / 150)
  for (let i = 0; i < grassTicks; i++) {
    s = grassDecay(s)
  }
  return s
}
