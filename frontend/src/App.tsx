import { useEffect, useRef, useState } from 'react'
import './App.scss'
import {
  initialState,
  grassDecay,
  woolGrow,
  buySheep as doBuySheep,
} from './gameLogic'

function App() {
  const [state, setState] = useState(initialState)

  // Grass decays: 10% + 5% per extra sheep every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setState(grassDecay)
    }, 5 * 60 * 1000)

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

  return (
    <div className="farm">
      <h1 className="farm-title">My Farm</h1>

      <div className="grass-row">
        <div className="bar-container">
          <div className="bar-label">Grass</div>
          <div className="bar">
            <div className="fill grass" style={{ width: `${state.grass}%` }} />
          </div>
          <span className="bar-value">{state.grass}%</span>
        </div>
      </div>

      <div className="wool-row">
        <div className="bar-container">
          <div className="bar-label">Wool</div>
          <div className="bar">
            <div className="fill wool" style={{ width: `${state.wool}%` }} />
          </div>
          <span className="bar-value">{Math.round(state.wool)}%</span>
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

      <div className="gold-display">
        <span className="coin">🪙</span> {state.gold}
      </div>
    </div>
  )
}

export default App
