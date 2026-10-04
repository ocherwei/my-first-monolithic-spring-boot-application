export interface GameState {
  grass: number       // 0-100 (0 = pasture empty, stays at 0 when overgrazed)
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

const PerSheepGrassCost = 3  // 3% per sheep per tick
const PerSheepHayCost = 5  // 5% per sheep per tick (when grass = 0)
const DeathInterval = 3  // 1 sheep dies every 3 ticks (7.5 minutes)

// Exponential regen: 0.01 * grass² — scales with current grass level
// High grass → fast regen (produces hay when over 100)
// Low grass → slow regen (stays low, drains to 0 when overgrazed)

export function grassDecay(state: GameState): GameState {
  if (state.sheep === 0) return state

  // Phase 1: grass available
  if (state.grass > 0) {
    const consumption = state.sheep * PerSheepGrassCost
    const afterConsumption = Math.max(0, state.grass - consumption)
    const regen = 0.01 * afterConsumption * afterConsumption  // exponential
    const afterRegen = afterConsumption + regen

    // Overflow: grass capped at 100, excess → hay
    if (afterRegen >= 100) {
      const overflow = afterRegen - 100
      const cappedHay = Math.min(100, state.hay + overflow)
      return { ...state, grass: 100, hay: cappedHay, deathCounter: 0 }
    }

    // Draining: grass = capped to 0 minimum (no negative %)
    return { ...state, grass: afterRegen, hay: state.hay, deathCounter: 0 }
  }

  // Phase 2: grass = 0, hay available
  if (state.hay > 0) {
    const consumption = state.sheep * PerSheepHayCost
    const newHay = Math.max(0, state.hay - consumption)
    const newCounter = state.deathCounter + 1
    if (newHay <= 0) {
      return { ...state, hay: 0, deathCounter: newCounter }
    }
    return { ...state, hay: newHay, deathCounter: 0 }
  }

  // Phase 3: death
  const newCounter = state.deathCounter + 1
  if (newCounter >= DeathInterval && state.sheep > 0) {
    return { ...state, deathCounter: 0, sheep: state.sheep - 1 }
  }
  return { ...state, deathCounter: newCounter }
}

export function getGrassRate(state: GameState): number {
  // Returns net grass change per tick (negative = grazing, positive = regrowing)
  if (state.sheep === 0 || state.grass <= 0) return 0
  const consumption = state.sheep * PerSheepGrassCost
  const afterConsumption = Math.max(0, state.grass - consumption)
  const regen = 0.01 * afterConsumption * afterConsumption
  return regen - consumption  // negative = draining, positive = regrowing
}

export function getHayRate(state: GameState): number {
  // Returns hay change per tick when grass = 0 (always negative, -draining)
  if (state.grass > 0 || state.hay <= 0 || state.sheep === 0) return 0
  return -state.sheep * PerSheepHayCost
}

export function getGoldRate(state: GameState): number {
  // Returns gold per second: wool shearing generates gold
  // Each sheep grows wool at 1%/sec. Shear happens at wool = 100.
  // Gold per shear = 5 * sheep, time to shear = (100 - currentWool) / sheep seconds
  // We approximate: net gold/sec ≈ 5 when near 100 wool, 0 otherwise
  // Better: 5 * sheep / ((100 - state.wool) / Math.max(1, state.sheep)) = 5 * state.sheep * state.sheep / (100 - state.wool)
  if (state.sheep === 0 || state.wool >= 99) return 0
  const timeToShear = (100 - state.wool) / Math.max(1, state.sheep)
  return (5 * state.sheep) / timeToShear
}

export function woolGrow(state: GameState): GameState {
  if (state.wool >= 100) {
    return { ...state, wool: 0, gold: state.gold + 5 * state.sheep }
  }
  return { ...state, wool: Math.min(100, state.wool + state.sheep) }
}

export function buySheep(state: GameState): GameState | null {
  if (state.gold < 15) return null
  return { ...state, gold: state.gold - 15, sheep: state.sheep + 1 }
}

const GoldPerHayPercent = 300  // gold cost per 1% of hay purchased

export function buyEmergencyHay(state: GameState, targetHay: number): GameState | null {
  const current = state.hay
  const needed = Math.min(targetHay, 100) - current
  if (needed <= 0) return null
  const cost = needed * GoldPerHayPercent
  if (state.gold < cost) return null
  return { ...state, gold: state.gold - cost, hay: targetHay, deathCounter: 0 }
}

export function canBuyEmergencyHay(state: GameState, targetHay: number): boolean {
  const current = state.hay
  const needed = Math.min(targetHay, 100) - current
  if (needed <= 0) return true
  const cost = needed * GoldPerHayPercent
  return state.gold >= cost
}

export function emergencyHayCost(state: GameState, targetHay: number): number {
  const current = state.hay
  const needed = Math.max(0, Math.min(targetHay, 100) - current)
  return needed * GoldPerHayPercent
}

/** Advance all timers by a given amount (seconds). */
export function tick(state: GameState, seconds: number): GameState {
  let s = state
  for (let i = 0; i < seconds; i++) {
    s = woolGrow(s)
  }
  const grassTicks = Math.floor(seconds / 150)
  for (let i = 0; i < grassTicks; i++) {
    s = grassDecay(s)
  }
  return s
}
