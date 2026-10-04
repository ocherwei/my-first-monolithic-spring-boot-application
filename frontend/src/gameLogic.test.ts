import { describe, it, expect } from 'vitest'
import {
  initialState,
  grassDecay,
  woolGrow,
  buySheep,
  tick,
} from './gameLogic'

describe('initialState', () => {
  it('starts with correct values', () => {
    expect(initialState).toEqual({
      grass: 100,
      hay: 0,
      wool: 0,
      gold: 10,
      sheep: 1,
      autoBuySheep: false,
      deathCounter: 0,
    })
  })
})

describe('grassDecay (Phase 1 — grass available)', () => {
  it('net +6% with 1 sheep at grass 50 (50 - 3 + 9 = 56)', () => {
    const result = grassDecay({ ...initialState, grass: 50, hay: 0 })
    expect(result.grass).toBe(56)
  })

  it('net +3% with 2 sheep at grass 50 (50 - 6 + 9 = 53)', () => {
    const result = grassDecay({ ...initialState, grass: 50, hay: 0, sheep: 2 })
    expect(result.grass).toBe(53)
  })

  it('net 0% with 3 sheep at grass 50 (50 - 9 + 9 = 50)', () => {
    const result = grassDecay({ ...initialState, grass: 50, hay: 0, sheep: 3 })
    expect(result.grass).toBe(50)
  })

  it('produces 6% hay when 1 sheep and grass at 100 (9% regen - 3% eat = 6% overflow)', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0 })
    // 1 sheep: 100 - 3 = 97, +9 = 106 → overflow 6 → hay += 6
    expect(result.grass).toBe(100)
    expect(result.hay).toBe(6)
  })

  it('produces 3% hay when 2 sheep and grass at 100 (9% regen - 6% eat = 3% overflow)', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0, sheep: 2 })
    // 2 sheep: 100 - 6 = 94, +9 = 103 → overflow 3 → hay += 3
    expect(result.grass).toBe(100)
    expect(result.hay).toBe(3)
  })

  it('produces 0% hay when 3 sheep (9% regen - 9% eat = 0 overflow)', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0, sheep: 3 })
    // 3 sheep: 100 - 9 = 91, +9 = 100 → overflow 0
    expect(result.grass).toBe(100)
    expect(result.hay).toBe(0)
  })

  it('depletes grass when 4 sheep (12% consumption > 9% regen)', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0, sheep: 4 })
    // 4 sheep: 100 - 12 = 88, +9 = 97
    expect(result.grass).toBe(97)
  })

  it('caps hay at 100', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 98, sheep: 1 })
    // overflow 6, 98 + 6 = 104 → capped at 100
    expect(result.hay).toBe(100)
  })

  it('does not change other state fields', () => {
    const result = grassDecay({ ...initialState, grass: 50, wool: 30, gold: 20, sheep: 2 })
    expect(result.wool).toBe(30)
    expect(result.gold).toBe(20)
    expect(result.sheep).toBe(2)
  })

  it('does nothing when 0 sheep', () => {
    const result = grassDecay({ ...initialState, grass: 50, sheep: 0 })
    expect(result).toEqual({ ...initialState, grass: 50, sheep: 0 })
  })
})

describe('grassDecay (Phase 2 — grass = 0, hay available)', () => {
  it('consumes 5% per sheep from hay', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 50 })
    expect(result.hay).toBe(45) // 50 - 5 (1 sheep)
  })

  it('consumes 10% from hay with 2 sheep', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 50, sheep: 2 })
    expect(result.hay).toBe(40) // 50 - 10
  })

  it('cleans hay to 0 and increments deathCounter when hay exhausted', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 3, sheep: 1 })
    expect(result.hay).toBe(0)
    expect(result.deathCounter).toBe(1)
  })

  it('resets deathCounter when hay has buffer', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 20, deathCounter: 2 })
    expect(result.hay).toBe(15)
    expect(result.deathCounter).toBe(0)
  })
})

describe('grassDecay (Phase 3 — grass = 0, hay = 0)', () => {
  it('increments deathCounter each tick', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 0, deathCounter: 0 })
    expect(result.deathCounter).toBe(1)
  })

  it('kills 1 sheep every 3 ticks (7.5 minutes)', () => {
    let s: typeof initialState = { ...initialState, grass: 0, hay: 0, sheep: 5 }
    s = grassDecay(s)  // counter = 1
    s = grassDecay(s)  // counter = 2
    s = grassDecay(s)  // counter → 3 → death!
    expect(s.sheep).toBe(4)
  })

  it('resets deathCounter after each death', () => {
    let s: typeof initialState = { ...initialState, grass: 0, hay: 0, sheep: 5 }
    // 3 ticks → death (counter = 0)
    s = grassDecay(s)
    s = grassDecay(s)
    s = grassDecay(s)
    expect(s.sheep).toBe(4)
    // 3 more ticks → second death
    s = grassDecay(s)
    s = grassDecay(s)
    s = grassDecay(s)
    expect(s.sheep).toBe(3)
  })

  it('does not kill below 0', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 0, sheep: 1 })
    expect(result.sheep).toBe(1)
  })

  it('does nothing when 0 sheep', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 0, sheep: 0 })
    expect(result.sheep).toBe(0)
  })
})

describe('woolGrow', () => {
  it('grows 1% with 1 sheep', () => {
    const result = woolGrow({ ...initialState, wool: 10, sheep: 1 })
    expect(result.wool).toBe(11)
  })

  it('grows N% with N sheep (2 sheep = 2% per tick)', () => {
    const result = woolGrow({ ...initialState, wool: 10, sheep: 3 })
    expect(result.wool).toBe(13)
  })

  it('clamps wool at 100', () => {
    const result = woolGrow({ ...initialState, wool: 98, sheep: 3 })
    // 98 + 3 = 101 → clamped to 100
    expect(result.wool).toBe(100)
  })

  it('does not shear when wool < 100', () => {
    const result = woolGrow({ ...initialState, wool: 99, sheep: 2 })
    expect(result.wool).toBe(100)
    expect(result.gold).toBe(initialState.gold)
  })

  it('triggers shear at 100: resets wool, awards gold', () => {
    const state = { ...initialState, wool: 100, sheep: 2, gold: 20 }
    const result = woolGrow(state)
    expect(result.wool).toBe(0)
    // shear gold = 5 * sheep = 10
    expect(result.gold).toBe(30)
  })

  it('awards 5 gold per sheep on shear', () => {
    const state = { ...initialState, wool: 100, sheep: 3, gold: 0 }
    const result = woolGrow(state)
    expect(result.gold).toBe(15) // 5 * 3 sheep
  })
})

describe('buySheep', () => {
  it('buys a sheep when enough gold', () => {
    const result = buySheep({ ...initialState, gold: 15 })
    expect(result).not.toBeNull()
    expect(result!.sheep).toBe(2)
    expect(result!.gold).toBe(0)
  })

  it('buys a sheep with 16 gold (leaves 1)', () => {
    const result = buySheep({ ...initialState, gold: 16 })
    expect(result).not.toBeNull()
    expect(result!.gold).toBe(1)
    expect(result!.sheep).toBe(2)
  })

  it('does nothing when gold < 15', () => {
    const result = buySheep({ ...initialState, gold: 14 })
    expect(result).toBeNull()
  })

  it('does not change other fields', () => {
    const state = { ...initialState, grass: 50, wool: 30, gold: 30 }
    const result = buySheep(state)
    expect(result).not.toBeNull()
    expect(result!.grass).toBe(50)
    expect(result!.wool).toBe(30)
  })
})

describe('tick (combined advance)', () => {
  it('advances wool 1% per second per sheep', () => {
    const result = tick(initialState, 5) // 5 sheep → 5%/s × 5s
    // 5 ticks, each adds 1 (sheep=1) → 5%
    expect(result.wool).toBe(5)
  })

  it('advances wool faster with more sheep', () => {
    const result = tick({ ...initialState, sheep: 3 }, 10)
    // 10 ticks, each adds 3 → 30%
    expect(result.wool).toBe(30)
  })

  it('triggers shear when wool reaches 100', () => {
    // 5 ticks × 2% = 10 → 95+10 → shear on tick 3 (95+6=101)
    // 2 remaining ticks: 0+4=4, no more shear
    const result = tick({ ...initialState, sheep: 2, wool: 95 }, 5)
    expect(result.wool).toBe(2)
    expect(result.gold).toBe(20)
  })

  it('decays grass every 2.5 minutes (150s)', () => {
    const result = tick({ ...initialState, grass: 80, sheep: 1 }, 300)
    // 300s = 2 grass ticks, net +6/tick → 80 + 12 = 92
    expect(result.grass).toBe(92)
  })

  it('steady with 3 sheep (9% eat = 9% regen)', () => {
    const result = tick({ ...initialState, grass: 80, sheep: 3 }, 300)
    // 300s = 2 grass ticks, net 0 → 80 stays 80
    expect(result.grass).toBe(80)
  })

  it('runs all game loops in correct order', () => {
    const state = { ...initialState, gold: 10, sheep: 2, wool: 95, grass: 80 }
    const result = tick(state, 304)
    // 304s: 300s grass (2 ticks) + 4s wool
    // Wool: 95 + 4*2 = 103 → shear → wool=0, gold=20 (10+10), then 0+0=0 (clamped)
    expect(result).toBeDefined()
    expect(result.sheep).toBe(2)
  })

  it('buySheep then tick produces more wool and faster grass decay', () => {
    const state = { ...initialState, gold: 15, grass: 100 }
    const bought = buySheep(state)!
    const afterTick = tick(bought, 150)
    // After buying: sheep=2, gold=0
    // 150s grass: 1 tick, 2*3 = 6% eat, 9% regen → 100 - 6 + 9 = 103 → overflow 3 → hay = 3
    expect(afterTick.grass).toBe(100)
    expect(afterTick.hay).toBe(3)
  })

  it('accumulates hay when 1 sheep and grass at 100 (9% regen - 3% eat = 6% overflow)', () => {
    const state = { ...initialState, grass: 100, hay: 0 }
    // 1 tick: 100 - 3 (eat) + 9 (regen) = 106 → overflow 6 → hay = 6
    const result = tick(state, 150)
    expect(result.hay).toBe(6)
    expect(result.grass).toBe(100)
  })

  it('accumulates hay when 2 sheep and grass at 100 (9% regen - 6% eat = 3% overflow)', () => {
    const state = { ...initialState, sheep: 2, grass: 100, hay: 0 }
    // 1 tick: 100 - 6 (eat) + 9 (regen) = 103 → overflow 3 → hay = 3
    const result = tick(state, 150)
    expect(result.hay).toBe(3)
    expect(result.grass).toBe(100)
  })

  it('produces 0 hay when 3 sheep (9% regen - 9% eat = 0 overflow)', () => {
    const state = { ...initialState, sheep: 3, grass: 100, hay: 0 }
    const result = tick(state, 150)
    expect(result.hay).toBe(0)
    expect(result.grass).toBe(100)
  })

  it('depletes grass when 4 sheep (12% consumption > 9% regen)', () => {
    const state = { ...initialState, sheep: 4, grass: 100, hay: 0 }
    const result = tick(state, 150)
    // 100 - 12 + 9 = 97
    expect(result.grass).toBe(97)
  })

  it('enters Phase 2 (hay consumption) when grass hits 0', () => {
    const state = { ...initialState, grass: 0, hay: 20, sheep: 1 }
    const result = tick(state, 150)
    // hay: 20 - 5 = 15
    expect(result.hay).toBe(15)
    expect(result.grass).toBe(0)
  })

  it('enters Phase 3 (death) when both grass and hay hit 0', () => {
    const state: typeof initialState = { ...initialState, grass: 0, hay: 0, sheep: 3 }
    // 3 ticks → 1 death (7.5 minutes)
    const result = tick(state, 450) // 450s = 3 grass ticks
    expect(result.sheep).toBe(2)
  })
})
