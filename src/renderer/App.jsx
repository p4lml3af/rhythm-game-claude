import React from 'react'
import { GameCanvas } from './components/GameCanvas'

function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000000'
    }}>
      <GameCanvas width={800} height={600} />
    </div>
  )
}

export default App
