import { useEffect, useState } from 'react'
import './App.scss'

function App() {
  const [grass, setGrass] = useState(100) // 0-100
  const [wool, setWool] = useState(0)    // 0-100
  const [gold, setGold] = useState(0)
  const [sheep, setSheep] = useState(1)  // number of sheep (fixed for now)

  // Grass decays: 10% every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setGrass((g) => Math.max(0, g - 10))
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Wool fills: 100% every 1 minute, auto-shears to gold
  useEffect(() => {
    const interval = setInterval(() => {
      setWool((w) => {
        if (w >= 100) {
          // Shear: wool → 0, gold += 5
          setGold((g) => g + 5)
          return 0
        }
        return w + 10 // 10% per minute
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

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

      <div className="sheep-row">🐑</div>

      <div className="gold-display">
        <span className="coin">🪙</span> {gold}
      </div>
    </div>
  )
}

export default App
