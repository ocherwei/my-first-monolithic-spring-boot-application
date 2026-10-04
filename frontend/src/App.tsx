import { useEffect, useRef, useState } from 'react'
import './App.scss'
import {
  initialState,
  grassDecay,
  woolGrow,
  buySheep as doBuySheep,
  buyEmergencyHay as doBuyEmergencyHay,
} from './gameLogic'

const STORAGE_KEY = 'farmState'

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function loadFromStorage() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with initialState so new fields (hay, deathCounter) get defaults
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
    }, 2.5 * 60 * 1000)

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
  // When gold drops (manual purchase / higher deduction), reset the baseline
  // so future gold increases can trigger purchases again.
  const lastBoughtGold = useRef<number>(state.gold)

  useEffect(() => {
    if (state.autoBuySheep) {
      if (state.gold < lastBoughtGold.current) {
        // Gold dropped — reset baseline so next increase triggers a buy
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

  // Emergency hay: 500 gold per hay %
  const buyHalfHay = () => {
    const next = doBuyEmergencyHay(state, 50)
    if (next) setState(next)
  }

  const buyFullHay = () => {
    const next = doBuyEmergencyHay(state, 100)
    if (next) setState(next)
  }

  const halfCost = Math.max(0, 50 - state.hay) * 500
  const fullCost = Math.max(0, 100 - state.hay) * 500

  return (
    <div className="farm">
      <h1 className="farm-title">My Farm</h1>

      <div className="grass-row">
        <div className="bar-container">
          <div className="bar-label">
            <span className="bar-icon grass-icon">🌱</span>Grass
          </div>
          <div className="bar">
            <div className="fill grass" style={{ width: `${clamp(state.grass)}%` }} />
          </div>
          <span className="bar-value">{Math.round(clamp(state.grass))}%</span>
        </div>
      </div>

      <div className="hay-row">
        <div className="bar-container">
          <div className="bar-label">
            <span className="bar-icon hay-icon">🌾</span>Hay
          </div>
          <div className="bar">
            <div className="fill hay" style={{ width: `${clamp(state.hay)}%` }} />
          </div>
          <span className="bar-value">{Math.round(clamp(state.hay))}%</span>
        </div>
      </div>

      <div className="wool-row">
        <div className="bar-container">
          <div className="bar-label">
            <span className="bar-icon wool-icon">🧶</span>Wool
          </div>
          <div className="bar">
            <div className="fill wool" style={{ width: `${clamp(state.wool)}%` }} />
          </div>
          <span className="bar-value">{Math.round(clamp(state.wool))}%</span>
        </div>
      </div>

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

      {state.grass === 0 && (
        <div className="emergency-controls">
          <button
            className="emergency-btn half"
            onClick={buyHalfHay}
            disabled={state.gold < halfCost}
          >
            50% Hay — {halfCost} <span className="btn-coin">🪙</span>
          </button>
          <button
            className="emergency-btn full"
            onClick={buyFullHay}
            disabled={state.gold < fullCost}
          >
            100% Hay — {fullCost} <span className="btn-coin">🪙</span>
          </button>
        </div>
      )}

      <div className="gold-display">
        <span className="coin">🪙</span> {state.gold}
      </div>
    </div>
  )
}

export default App
