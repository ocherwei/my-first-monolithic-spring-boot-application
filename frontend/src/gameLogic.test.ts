import { describe, it, expect } from 'vitest'
import {
  initialState,
  grassDecay,
  getGrassRate,
  getHayRate,
  getGoldRate,
  woolGrow,
  buySheep,
  buyEmergencyHay,
  canBuyEmergencyHay,
  emergencyHayCost,
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

describe('getGrassRate', () => {
  it('returns 0 when 0 sheep', () => {
    expect(getGrassRate({ ...initialState, grass: 50, sheep: 0 })).toBe(0)
  })

  it('returns 0 when grass <= 0', () => {
    expect(getGrassRate({ ...initialState, grass: 0, sheep: 5 })).toBe(0)
  })

  it('returns negative when overgrazed (high sheep)', () => {
    const rate = getGrassRate({ ...initialState, grass: 50, sheep: 20 })
    expect(rate).toBeLessThan(0)
  })

  it('returns positive when regrowing (low sheep)', () => {
    const rate = getGrassRate({ ...initialState, grass: 50, sheep: 1 })
    expect(rate).toBeGreaterThan(0)
  })
})

describe('getHayRate', () => {
  it('returns 0 when grass > 0', () => {
    expect(getHayRate({ ...initialState, grass: 10, hay: 50, sheep: 5 })).toBe(0)
  })

  it('returns 0 when 0 sheep', () => {
    expect(getHayRate({ ...initialState, grass: 0, hay: 50, sheep: 0 })).toBe(0)
  })

  it('returns negative when draining (grass = 0, hay > 0)', () => {
    const rate = getHayRate({ ...initialState, grass: 0, hay: 50, sheep: 2 })
    expect(rate).toBe(-10) // 2 * 5
  })
})

describe('getGoldRate', () => {
  it('returns 0 when 0 sheep', () => {
    expect(getGoldRate({ ...initialState, sheep: 0 })).toBe(0)
  })

  it('returns 0 when wool >= 99 (not actively generating)', () => {
    expect(getGoldRate({ ...initialState, wool: 99 })).toBe(0)
  })

  it('returns positive when actively generating gold (mid-wool)', () => {
    const rate = getGoldRate({ ...initialState, wool: 50, sheep: 5 })
    expect(rate).toBeGreaterThan(0)
  })
})

describe('grassDecay (Phase 1 — grass available, exponential regen 0.01 * grass²)', () => {
  it('1 sheep at 50: 47 + 0.01*47² = 47 + 22.09 = 69.09', () => {
    const result = grassDecay({ ...initialState, grass: 50, hay: 0 })
    expect(result.grass).toBeCloseTo(69.09, 1)
  })

  it('2 sheep at 50: 44 + 0.01*44² = 44 + 19.36 = 63.36', () => {
    const result = grassDecay({ ...initialState, grass: 50, hay: 0, sheep: 2 })
    expect(result.grass).toBeCloseTo(63.36, 1)
  })

  it('3 sheep at 50: 41 + 0.01*41² = 41 + 16.81 = 57.81', () => {
    const result = grassDecay({ ...initialState, grass: 50, hay: 0, sheep: 3 })
    expect(result.grass).toBeCloseTo(57.81, 1)
  })

  it('1 sheep at 100: 97 + 94.09 = 191.09 → overflow 91.09', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0 })
    expect(result.grass).toBe(100)
    expect(result.hay).toBeCloseTo(91.09, 1)
  })

  it('2 sheep at 100: 94 + 88.36 = 182.36 → overflow 82.36', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0, sheep: 2 })
    expect(result.grass).toBe(100)
    expect(result.hay).toBeCloseTo(82.36, 1)
  })

  it('5 sheep at 100: 85 + 72.25 = 157.25 → overflow 57.25', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0, sheep: 5 })
    expect(result.grass).toBe(100)
    expect(result.hay).toBeCloseTo(57.25, 1)
  })

  it('8 sheep at 100: drains (76 + 57.76 = 133.76 → overflow 33.76)', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 0, sheep: 8 })
    expect(result.grass).toBe(100)
    expect(result.hay).toBeCloseTo(33.76, 1)
  })

  it('caps hay at 100', () => {
    const result = grassDecay({ ...initialState, grass: 100, hay: 98, sheep: 1 })
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
  it('consumes 5% per sheep from hay (1 sheep = 5%)', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 50 })
    expect(result.hay).toBe(45)
  })

  it('consumes 10% from hay with 2 sheep', () => {
    const result = grassDecay({ ...initialState, grass: 0, hay: 50, sheep: 2 })
    expect(result.hay).toBe(40)
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
    s = grassDecay(s); s = grassDecay(s); s = grassDecay(s)
    expect(s.sheep).toBe(4)
    s = grassDecay(s); s = grassDecay(s); s = grassDecay(s)
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

  it('grows N% with N sheep (3 sheep = 3% per tick)', () => {
    const result = woolGrow({ ...initialState, wool: 10, sheep: 3 })
    expect(result.wool).toBe(13)
  })

  it('clamps wool at 100', () => {
    const result = woolGrow({ ...initialState, wool: 98, sheep: 3 })
    expect(result.wool).toBe(100)
  })

  it('triggers shear at 100: resets wool, awards gold', () => {
    const state = { ...initialState, wool: 100, sheep: 2, gold: 20 }
    const result = woolGrow(state)
    expect(result.wool).toBe(0)
    expect(result.gold).toBe(30)
  })

  it('awards 5 gold per sheep on shear', () => {
    const state = { ...initialState, wool: 100, sheep: 3, gold: 0 }
    const result = woolGrow(state)
    expect(result.gold).toBe(15)
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
})

describe('buyEmergencyHay', () => {
  it('buys 25% hay (from 0: (25-0)*300 = 7500)', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 7500 }, 25)
    expect(result).not.toBeNull()
    expect(result!.hay).toBe(25)
    expect(result!.gold).toBe(0)
    expect(result!.deathCounter).toBe(0)
  })

  it('buys 50% hay (from 0: (50-0)*300 = 15000)', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 15000 }, 50)
    expect(result).not.toBeNull()
    expect(result!.hay).toBe(50)
    expect(result!.gold).toBe(0)
  })

  it('buys 75% hay (from 0: (75-0)*300 = 22500)', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 22500 }, 75)
    expect(result).not.toBeNull()
    expect(result!.hay).toBe(75)
    expect(result!.gold).toBe(0)
  })

  it('buys 100% hay (from 0: (100-0)*300 = 30000)', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 30000 }, 100)
    expect(result).not.toBeNull()
    expect(result!.hay).toBe(100)
    expect(result!.gold).toBe(0)
  })

  it('buys partial (from 30 to 50: (50-30)*300 = 6000)', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 30, gold: 6000 }, 50)
    expect(result).not.toBeNull()
    expect(result!.hay).toBe(50)
    expect(result!.gold).toBe(0)
  })

  it('resets deathCounter when buying', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 7500, deathCounter: 2 }, 25)
    expect(result).not.toBeNull()
    expect(result!.deathCounter).toBe(0)
  })

  it('does nothing when already at or above target', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 60, gold: 50000 }, 50)
    expect(result).toBeNull()
  })

  it('does nothing when not enough gold (25% needs 7500)', () => {
    const result = buyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 7499 }, 25)
    expect(result).toBeNull()
  })

  it('does not change other fields', () => {
    const state = { ...initialState, grass: 0, hay: 0, wool: 50, sheep: 3, gold: 7500 }
    const result = buyEmergencyHay(state, 25)
    expect(result).not.toBeNull()
    expect(result!.wool).toBe(50)
    expect(result!.sheep).toBe(3)
  })
})

describe('canBuyEmergencyHay', () => {
  it('returns true when enough gold for 25% (7500)', () => {
    expect(canBuyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 7500 }, 25)).toBe(true)
  })

  it('returns false when not enough gold (7499)', () => {
    expect(canBuyEmergencyHay({ ...initialState, grass: 0, hay: 0, gold: 7499 }, 25)).toBe(false)
  })

  it('returns true when already at or above target', () => {
    expect(canBuyEmergencyHay({ ...initialState, grass: 0, hay: 60, gold: 0 }, 50)).toBe(true)
  })
})

describe('emergencyHayCost', () => {
  it('25% from 0: (25-0)*300 = 7500', () => {
    expect(emergencyHayCost({ ...initialState, grass: 0, hay: 0 }, 25)).toBe(7500)
  })

  it('50% from 0: (50-0)*300 = 15000', () => {
    expect(emergencyHayCost({ ...initialState, grass: 0, hay: 0 }, 50)).toBe(15000)
  })

  it('partial (from 30 to 50): (50-30)*300 = 6000', () => {
    expect(emergencyHayCost({ ...initialState, grass: 0, hay: 30 }, 50)).toBe(6000)
  })

  it('partial (from 18 to 50): (50-18)*300 = 9600', () => {
    expect(emergencyHayCost({ ...initialState, grass: 0, hay: 18 }, 50)).toBe(9600)
  })
})

describe('tick (combined advance)', () => {
  it('advances wool 1% per second per sheep', () => {
    const result = tick(initialState, 5)
    expect(result.wool).toBe(5)
  })

  it('triggers shear when wool reaches 100', () => {
    const result = tick({ ...initialState, sheep: 2, wool: 95 }, 5)
    expect(result.wool).toBe(2)
    expect(result.gold).toBe(20)
  })

  it('1 sheep at 80: 77 + 59.29 = 136.29 → overflow 36.29, grass = 100', () => {
    const result = tick({ ...initialState, grass: 80, sheep: 1 }, 300)
    expect(result.grass).toBe(100)
  })

  it('2 sheep at 80: 74 + 54.76 = 128.76 → overflow 28.76, grass = 100', () => {
    const result = tick({ ...initialState, grass: 80, sheep: 2 }, 300)
    expect(result.grass).toBe(100)
  })

  it('produces hay when 5 sheep and grass starts at 100', () => {
    const state = { ...initialState, sheep: 5, grass: 100, hay: 0 }
    const result = tick(state, 150)
    // 100 - 15 = 85, regen = 0.01 * 85² = 72.25, 85 + 72.25 = 157.25 → overflow 57.25
    expect(result.hay).toBeCloseTo(57.25, 1)
    expect(result.grass).toBe(100)
  })

  it('produces 82.36 hay when 2 sheep at 100 (94 + 88.36 = 182.36)', () => {
    const state = { ...initialState, sheep: 2, grass: 100, hay: 0 }
    const result = tick(state, 150)
    expect(result.hay).toBeCloseTo(82.36, 1)
  })

  it('8 sheep at 100: 76 + 57.76 = 133.76, grass stays 100 (overflows to hay)', () => {
    const state = { ...initialState, sheep: 8, grass: 100, hay: 0 }
    const result = tick(state, 150)
    expect(result.grass).toBe(100)
  })

  it('enters Phase 2 (hay consumption) when grass hits 0', () => {
    const state = { ...initialState, grass: 0, hay: 20, sheep: 1 }
    const result = tick(state, 150)
    expect(result.hay).toBe(15)
    expect(result.grass).toBe(0)
  })

  it('enters Phase 3 (death) when both grass and hay hit 0', () => {
    const state: typeof initialState = { ...initialState, grass: 0, hay: 0, sheep: 3 }
    const result = tick(state, 450) // 3 grass ticks = 7.5 minutes
    expect(result.sheep).toBe(2)
  })
})
