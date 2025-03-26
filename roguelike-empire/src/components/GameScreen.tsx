import React, { useState, useEffect } from 'react'
import '../styles/GameScreen.css'
import GameHeader from './game/GameHeader'
import WorldMap from './game/WorldMap'
import ActionPanel from './game/ActionPanel'
import StatusPanel from './game/StatusPanel'
import EventLog from './game/EventLog'
import { generateInitialState, processAITurn } from '../game/gameLogic'
import { GameState, PlayerAction, Event } from '../types/gameTypes'

type GameScreenProps = {
  faction: 'china' | 'usa'
  onGameOver: () => void
}

const GameScreen: React.FC<GameScreenProps> = ({ faction, onGameOver }) => {
  // 初始化游戏状态
  const [gameState, setGameState] = useState<GameState>(() => generateInitialState(faction))
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [actionPoints, setActionPoints] = useState<number>(3)
  const [events, setEvents] = useState<Event[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true)
  const [turnNumber, setTurnNumber] = useState<number>(1)
  
  // 处理玩家行动
  const handleAction = (action: PlayerAction) => {
    if (!isPlayerTurn || actionPoints <= 0) return
    
    // 更新游戏状态
    const { newState, cost, event } = processPlayerAction(gameState, action)
    setGameState(newState)
    setActionPoints(prev => prev - cost)
    
    // 如果有事件发生，添加到事件日志
    if (event) {
      setEvents(prev => [event, ...prev])
    }
    
    // 检查胜利条件
    checkVictoryConditions(newState)
  }
  
  // 处理玩家行动的具体逻辑
  const processPlayerAction = (state: GameState, action: PlayerAction) => {
    // 这里应该根据不同的行动类型实现不同的逻辑
    // 简化版实现
    const newState = { ...state }
    let cost = 1
    let event = null
    
    switch (action.type) {
      case 'economy':
        newState.player.economy.gdp *= 1.05
        newState.player.economy.growth += 0.2
        cost = 1
        break
      case 'trade':
        newState.player.economy.tradeBalance += 50
        cost = 1
        break
      case 'technology':
        newState.player.technology.researchPoints += 10
        cost = 2
        break
      case 'military':
        newState.player.military.strength += 5
        cost = 2
        break
      case 'diplomacy':
        newState.player.politics.internationalInfluence += 3
        cost = 1
        break
      default:
        break
    }
    
    // 随机生成事件
    if (Math.random() < 0.3) {
      event = generateRandomEvent(newState, action.type)
    }
    
    return { newState, cost, event }
  }
  
  // 生成随机事件
  const generateRandomEvent = (state: GameState, actionType: string): Event => {
    const eventTypes = ['positive', 'negative', 'neutral']
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    
    let title = ''
    let description = ''
    let effect = ''
    
    if (eventType === 'positive') {
      if (actionType === 'economy') {
        title = '经济繁荣'
        description = '你的经济政策取得了显著成效，国内生产总值大幅增长！'
        effect = 'GDP +5%'
        state.player.economy.gdp *= 1.05
      } else if (actionType === 'technology') {
        title = '技术突破'
        description = '你的科研团队取得了重大突破，研发进度加快！'
        effect = '研发点数 +15'
        state.player.technology.researchPoints += 15
      } else if (actionType === 'military') {
        title = '军事演习成功'
        description = '你组织的军事演习取得圆满成功，提升了军队战斗力！'
        effect = '军事实力 +5'
        state.player.military.strength += 5
      } else if (actionType === 'trade') {
        title = '贸易协议'
        description = '你成功签署了一项有利的贸易协议，改善了贸易平衡！'
        effect = '贸易平衡 +70'
        state.player.economy.tradeBalance += 70
      } else if (actionType === 'diplomacy') {
        title = '外交胜利'
        description = '你的外交努力获得了国际社会的认可，提升了国家影响力！'
        effect = '国际影响力 +5'
        state.player.politics.internationalInfluence += 5
      }
    } else if (eventType === 'negative') {
      if (actionType === 'economy') {
        title = '经济衰退'
        description = '全球经济下行，你的国家受到了波及。'
        effect = 'GDP -3%'
        state.player.economy.gdp *= 0.97
      } else if (actionType === 'military') {
        title = '军事事故'
        description = '一次军事演习中发生意外事故，造成了不良影响。'
        effect = '军事实力 -3'
        state.player.military.strength -= 3
      } else if (actionType === 'technology') {
        title = '研发受阻'
        description = '你的一项重要研究遇到了技术瓶颈，进度受到影响。'
        effect = '研发点数 -5'
        state.player.technology.researchPoints = Math.max(0, state.player.technology.researchPoints - 5)
      } else if (actionType === 'trade') {
        title = '贸易纠纷'
        description = '与贸易伙伴发生纠纷，影响了贸易关系。'
        effect = '贸易平衡 -30'
        state.player.economy.tradeBalance -= 30
      } else if (actionType === 'diplomacy') {
        title = '外交危机'
        description = '一场外交危机爆发，损害了你的国际形象。'
        effect = '国际影响力 -3'
        state.player.politics.internationalInfluence = Math.max(0, state.player.politics.internationalInfluence - 3)
      }
    } else {
      title = '国际会议'
      description = '一场国际会议召开，各国领导人讨论全球问题。'
      effect = '无直接影响'
    }
    
    return {
      id: Date.now(),
      turn: turnNumber,
      title,
      description,
      effect,
      type: eventType
    }
  }
  
  // 结束玩家回合
  const endTurn = () => {
    setIsPlayerTurn(false)
  }
  
  // AI回合处理
  useEffect(() => {
    if (!isPlayerTurn) {
      // 模拟AI思考时间
      const aiThinkingTime = setTimeout(() => {
        // 处理AI回合
        const { newState, event } = processAITurn(gameState)
        setGameState(newState)
        
        // 如果有事件发生，添加到事件日志
        if (event) {
          setEvents(prev => [event, ...prev])
        }
        
        // 检查胜利条件
        checkVictoryConditions(newState)
        
        // 回合数+1
        setTurnNumber(prev => prev + 1)
        
        // 重置行动点数并切换回玩家回合
        setActionPoints(3)
        setIsPlayerTurn(true)
      }, 1500)
      
      return () => clearTimeout(aiThinkingTime)
    }
  }, [isPlayerTurn, gameState])
  
  // 检查胜利条件
  const checkVictoryConditions = (state: GameState) => {
    // 经济胜利
    if (state.player.economy.gdp > state.opponent.economy.gdp * 2 && 
        state.player.economy.tradeBalance > 0) {
      handleVictory('economic')
      return
    }
    
    // 政治胜利
    if (state.player.politics.internationalInfluence > 80 && 
        state.opponent.politics.stability < 20) {
      handleVictory('political')
      return
    }
    
    // 军事胜利
    if (state.player.military.strength > state.opponent.military.strength * 1.5 && 
        state.player.military.readiness > 80) {
      handleVictory('military')
      return
    }
    
    // 科技胜利
    if (state.player.technology.completedTechs.length >= 3) {
      handleVictory('technological')
      return
    }
    
    // 检查游戏是否结束（回合数达到上限）
    if (turnNumber >= 300) {
      handleGameEnd()
    }
  }
  
  // 处理胜利
  const handleVictory = (victoryType: string) => {
    // 这里可以添加胜利相关的逻辑
    console.log(`${victoryType} victory achieved!`)
    onGameOver()
  }
  
  // 处理游戏结束
  const handleGameEnd = () => {
    console.log('Game ended after 300 turns')
    onGameOver()
  }
  
  return (
    <div className="game-screen">
      <GameHeader 
        turnNumber={turnNumber} 
        faction={faction} 
        actionPoints={actionPoints} 
        isPlayerTurn={isPlayerTurn} 
        onEndTurn={endTurn} 
      />
      
      <div className="game-content">
        <div className="game-main">
          <WorldMap gameState={gameState} />
          <ActionPanel 
            onAction={handleAction} 
            selectedAction={selectedAction} 
            setSelectedAction={setSelectedAction} 
            actionPoints={actionPoints} 
            isPlayerTurn={isPlayerTurn} 
          />
        </div>
        
        <div className="game-sidebar">
          <StatusPanel 
            playerStats={gameState.player} 
            opponentStats={gameState.opponent} 
          />
          <EventLog events={events} />
        </div>
      </div>
    </div>
  )
}

export default GameScreen