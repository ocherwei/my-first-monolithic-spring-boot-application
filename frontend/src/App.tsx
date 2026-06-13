import { useEffect, useState } from 'react'
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
        <span className="sheep-label">
          {Array.from({ length: state.sheep }, (_, i) => (
            <span key={i} className="sheep">🐑</span>
          ))}
        </span>
      </div>

      <button
        className="buy-btn"
        onClick={buySheep}
        disabled={state.gold < 15}
      >
        Buy Sheep - 15 <span className="btn-coin">🪙</span>
      </button>

      <div className="gold-display">
        <span className="coin">🪙</span> {state.gold}
      </div>
    </div>
  )
}

export default App
