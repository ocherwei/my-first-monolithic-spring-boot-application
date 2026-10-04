import { useEffect, useRef, useState } from 'react'
import './App.scss'
import {
  initialState,
  grassDecay,
  woolGrow,
  buySheep as doBuySheep,
  buyEmergencyHay as doBuyEmergencyHay,
  canBuyEmergencyHay,
  emergencyHayCost,
  getGrassRate,
  getHayRate,
  getGoldRate,
} from './gameLogic'

const STORAGE_KEY = 'farmState'
const HAY_TIERS = [25, 50, 75, 100]
const TICK_DURATION_SECONDS = 150  // 2.5 minutes

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function loadFromStorage() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...initialState, ...parsed }
    }
  } catch { /* ignore parse errors */ }
  return initialState
}

function App() {
  const [state, setState] = useState(loadFromStorage)

  // Auto-save to sessionStorage on every state change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Grass/hay system: 2.5-min ticks (grass → hay → death phases)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(grassDecay)
    }, TICK_DURATION_SECONDS * 1000)

    return () => clearInterval(interval)
  }, [])

  // Wool fills: 1% * sheep per second
  useEffect(() => {
    const interval = setInterval(() => {
      setState(woolGrow)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-buy: purchase when gold >= 15 and increases past the last gold value.
  const lastBoughtGold = useRef<number>(state.gold)

  useEffect(() => {
    if (state.autoBuySheep) {
      if (state.gold < lastBoughtGold.current) {
        lastBoughtGold.current = 0
      } else if (state.gold >= 15 && state.gold > lastBoughtGold.current) {
        lastBoughtGold.current = state.gold
        const next = doBuySheep(state)
        if (next) setState(next)
      }
    } else {
      lastBoughtGold.current = 0
    }
  }, [state.gold, state.autoBuySheep, state])

  // Buy sheep: costs 15 gold
  const buySheep = () => {
    const next = doBuySheep(state)
    if (next) setState(next)
  }

  // Compute rates once per render (consistent across all UI elements)
  const grassRate = getGrassRate(state)  // %/tick (positive = regrowing, negative = grazing)
  const hayRate = getHayRate(state)  // %/tick (negative = draining when grass = 0)
  const goldRate = getGoldRate(state)  // gold/sec (net gold generation)

  // Emergency hay: buy 25/50/75/100% at 300g per hay %
  const buyHay = (target: number) => {
    const next = doBuyEmergencyHay(state, target)
    if (next) setState(next)
  }

  return (
    <div className="farm">
      <h1 className="farm-title">My Farm</h1>

      {/* Grass row: bar + rate */}
      <div className="grass-row">
        <div className="bar-container">
          <div className="bar-label">
            <span className="bar-icon grass-icon">🌱</span>Grass
          </div>
          <div className="bar">
            <div className="fill grass" style={{ width: `${clamp(state.grass)}%` }} />
          </div>
          <div className="bar-value-row">
            <span className="bar-value grass-val">{clamp(state.grass)}%</span>
            <span className={`rate ${grassRate >= 0 ? 'positive' : 'negative'}`}>
              {grassRate >= 0 ? '+' : ''}{grassRate.toFixed(1)}%/tick
            </span>
          </div>
        </div>
      </div>

      {/* Hay row: bar + rate + buy buttons (when grass = 0) */}
      <div className="hay-row">
        <div className="bar-container">
          <div className="bar-label">
            <span className="bar-icon hay-icon">🌾</span>Hay
          </div>
          <div className="bar">
            <div className="fill hay" style={{ width: `${clamp(state.hay)}%` }} />
          </div>
          <div className="bar-value-row">
            <span className="bar-value hay-val">{clamp(state.hay)}%</span>
            <span className={`rate ${hayRate !== 0 ? 'negative' : 'positive'}`}>
              {hayRate === 0 ? '—' : `${hayRate.toFixed(1)}%/tick`}
            </span>
          </div>
        </div>

        {state.grass === 0 && (
          <div className="hay-buy-row">
            {HAY_TIERS.map((tier) => {
              const cost = emergencyHayCost(state, tier)
              const canBuy = canBuyEmergencyHay(state, tier)
              return (
                <button
                  key={tier}
                  className={`hay-buy-btn ${canBuy ? 'affordable' : ''}`}
                  onClick={() => buyHay(tier)}
                  disabled={!canBuy}
                >
                  {tier}% — {cost}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Wool row: bar + gold/s */}
      <div className="wool-row">
        <div className="bar-container">
          <div className="bar-label">
            <span className="bar-icon wool-icon">🧶</span>Wool
          </div>
          <div className="bar">
            <div className="fill wool" style={{ width: `${clamp(state.wool)}%` }} />
          </div>
          <div className="bar-value-row">
            <span className={`gold-rate ${goldRate > 0 ? 'positive' : 'negative'}`}>
              {goldRate > 0 ? `+${goldRate.toFixed(1)}` : '—'} gold/s
            </span>
          </div>
        </div>
      </div>

      {/* Sheep row */}
      <div className="sheep-row">
        {state.sheep <= 5
          ? Array.from({ length: state.sheep }, (_, i) => (
              <span key={i} className="sheep">🐑</span>
            ))
          : (
              <>
                <span className="sheep">🐑</span>
                <span className="sheep-count">×{state.sheep}</span>
              </>
            )}
      </div>

      {/* Sheep buy row */}
      <div className="buy-controls">
        <button
          className="buy-btn"
          onClick={buySheep}
          disabled={state.gold < 15 || state.autoBuySheep}
        >
          Buy Sheep - 15 <span className="btn-coin">🪙</span>
        </button>
        <button
          className={`auto-toggle-btn${state.autoBuySheep ? ' on' : ''}`}
          onClick={() =>
            setState((prev) => ({ ...prev, autoBuySheep: !prev.autoBuySheep }))
          }
        >
          Auto: {state.autoBuySheep ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Gold display */}
      <div className="gold-display">
        <span className="coin">🪙</span> {state.gold}
      </div>
    </div>
  )
}

export default App
