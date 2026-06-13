import { useEffect, useState, useRef } from 'react'
import './App.scss'

function App() {
  const [grass, setGrass] = useState(100) // 0-100
  const [wool, setWool] = useState(0)    // 0-100
  const [gold, setGold] = useState(10)
  const [sheep, setSheep] = useState(1)  // number of sheep
  const sheepRef = useRef(sheep)

  // Keep ref in sync with sheep state
  useEffect(() => {
    sheepRef.current = sheep
  }, [sheep])

  // Grass decays: 10% + 5% per extra sheep every 5 minutes
  useEffect(() => {
    const grassDeduction = 10 + Math.max(0, sheep - 1) * 5
    const interval = setInterval(() => {
      setGrass((g) => Math.max(0, g - grassDeduction))
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [sheep])

  // Wool fills: 1% * sheep per second
  useEffect(() => {
    const currentSheep = sheepRef.current
    const interval = setInterval(() => {
      setWool((w) => {
        if (w >= 100) {
          // Shear: wool → 0, gold += 5 * sheep
          setGold((g) => g + 5 * currentSheep)
          return 0
        }
        return Math.min(100, w + 1 * currentSheep)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Buy sheep: costs 15 gold
  const buySheep = () => {
    if (gold >= 15) {
      setGold((g) => g - 15)
      setSheep((s) => s + 1)
    }
  }

  return (
    <div className="farm">
      <h1 className="farm-title">My Farm</h1>

      <div className="grass-row">
        <div className="bar-container">
          <div className="bar-label">Grass</div>
          <div className="bar">
            <div className="fill grass" style={{ width: `${grass}%` }} />
          </div>
          <span className="bar-value">{grass}%</span>
        </div>
      </div>

      <div className="wool-row">
        <div className="bar-container">
          <div className="bar-label">Wool</div>
          <div className="bar">
            <div className="fill wool" style={{ width: `${wool}%` }} />
          </div>
          <span className="bar-value">{Math.round(wool)}%</span>
        </div>
      </div>

      <div className="sheep-row">
        <span className="sheep-label">
          {Array.from({ length: sheep }, (_, i) => (
            <span key={i} className="sheep">🐑</span>
          ))}
        </span>
      </div>

      <button
        className="buy-btn"
        onClick={buySheep}
        disabled={gold < 15}
      >
        Buy Sheep - 15 <span className="btn-coin">🪙</span>
      </button>

      <div className="gold-display">
        <span className="coin">🪙</span> {gold}
      </div>
    </div>
  )
}

export default App
