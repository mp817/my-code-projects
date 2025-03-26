import React from 'react'
import '../../styles/game/GameHeader.css'

type GameHeaderProps = {
  turnNumber: number
  faction: 'china' | 'usa'
  actionPoints: number
  isPlayerTurn: boolean
  onEndTurn: () => void
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  turnNumber, 
  faction, 
  actionPoints, 
  isPlayerTurn,
  onEndTurn 
}) => {
  const factionName = faction === 'china' ? '中国' : '美国'
  const factionIcon = faction === 'china' ? '🇨🇳' : '🇺🇸'
  const leaderName = faction === 'china' ? '习大大' : '川宝'
  
  return (
    <div className="game-header">
      <div className="header-left">
        <div className="faction-info">
          <span className="faction-icon">{factionIcon}</span>
          <div className="faction-details">
            <h2>{factionName}</h2>
            <p>领导人: {leaderName}</p>
          </div>
        </div>
      </div>
      
      <div className="header-center">
        <div className="turn-info">
          <h3>回合 {turnNumber}/300</h3>
          <p className="turn-date">{2020 + Math.floor(turnNumber / 12)}年{(turnNumber % 12) || 12}月</p>
        </div>
      </div>
      
      <div className="header-right">
        <div className="action-points">
          <span className="ap-label">行动点数:</span>
          <div className="ap-dots">
            {[...Array(3)].map((_, i) => (
              <span 
                key={i} 
                className={`ap-dot ${i < actionPoints ? 'active' : 'inactive'}`}
              ></span>
            ))}
          </div>
        </div>
        
        <button 
          className="end-turn-btn" 
          onClick={onEndTurn}
          disabled={!isPlayerTurn || actionPoints === 0}
        >
          {isPlayerTurn ? '结束回合' : '对手回合...'}
        </button>
      </div>
    </div>
  )
}

export default GameHeader