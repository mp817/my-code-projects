import React, { useState } from 'react'
import StartScreen from './components/StartScreen'
import GameScreen from './components/GameScreen'
import './styles/App.css'

type GameState = 'start' | 'playing' | 'gameover'
type Faction = 'china' | 'usa' | null

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start')
  const [selectedFaction, setSelectedFaction] = useState<Faction>(null)

  const startGame = (faction: Faction) => {
    setSelectedFaction(faction)
    setGameState('playing')
  }

  const endGame = () => {
    setGameState('gameover')
  }

  const restartGame = () => {
    setGameState('start')
    setSelectedFaction(null)
  }

  return (
    <div className="app">
      {gameState === 'start' && (
        <StartScreen onStartGame={startGame} />
      )}
      {gameState === 'playing' && selectedFaction && (
        <GameScreen 
          faction={selectedFaction} 
          onGameOver={endGame} 
        />
      )}
      {gameState === 'gameover' && (
        <div className="game-over-screen">
          <h1>游戏结束</h1>
          <button onClick={restartGame}>重新开始</button>
        </div>
      )}
    </div>
  )
}

export default App