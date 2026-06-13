import { useEffect, useState } from 'react'
import './App.scss'

interface HelloResponse {
  message: string
}

function App() {
  const [text, setText] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data: HelloResponse) => setText(data.message))
      .catch(() => setText('Error loading'))
  }, [])

  return (
    <div className="landing">
      <h1 className="title">{text}</h1>
    </div>
  )
}

export default App
