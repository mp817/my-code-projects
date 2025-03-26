import React from 'react'
import '../../styles/game/ActionPanel.css'
import { PlayerAction } from '../../types/gameTypes'

type ActionPanelProps = {
  onAction: (action: PlayerAction) => void
  selectedAction: string | null
  setSelectedAction: (action: string | null) => void
  actionPoints: number
  isPlayerTurn: boolean
}

const ActionPanel: React.FC<ActionPanelProps> = ({ 
  onAction, 
  selectedAction, 
  setSelectedAction, 
  actionPoints,
  isPlayerTurn 
}) => {
  // 定义可用的行动
  const actions = [
    {
      id: 'economy',
      title: '经济政策',
      description: '实施经济刺激政策，提升GDP和经济增长率',
      cost: 1,
      icon: '📈'
    },
    {
      id: 'trade',
      title: '贸易策略',
      description: '调整关税政策，改善贸易平衡',
      cost: 1,
      icon: '🚢'
    },
    {
      id: 'technology',
      title: '科技研发',
      description: '投资科技研发，获取研发点数',
      cost: 2,
      icon: '🔬'
    },
    {
      id: 'military',
      title: '军事部署',
      description: '增强军事实力和准备度',
      cost: 2,
      icon: '🛡️'
    },
    {
      id: 'diplomacy',
      title: '外交行动',
      description: '提升国际影响力，发展盟友关系',
      cost: 1,
      icon: '🤝'
    }
  ]
  
  // 处理行动选择
  const handleActionSelect = (actionId: string) => {
    if (!isPlayerTurn) return
    
    if (selectedAction === actionId) {
      setSelectedAction(null)
    } else {
      setSelectedAction(actionId)
    }
  }
  
  // 执行选中的行动
  const executeAction = () => {
    if (!selectedAction || !isPlayerTurn) return
    
    const action = actions.find(a => a.id === selectedAction)
    if (!action || action.cost > actionPoints) return
    
    const playerAction: PlayerAction = {
      type: selectedAction as any,
      description: action.description
    }
    
    onAction(playerAction)
    setSelectedAction(null)
  }
  
  return (
    <div className="action-panel">
      <h2 className="panel-title">行动面板</h2>
      
      <div className="actions-container">
        {actions.map(action => (
          <div 
            key={action.id}
            className={`action-card ${selectedAction === action.id ? 'selected' : ''} ${action.cost > actionPoints || !isPlayerTurn ? 'disabled' : ''}`}
            onClick={() => handleActionSelect(action.id)}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-content">
              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>
              <div className="action-cost">
                消耗点数: {action.cost}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="action-controls">
        <button 
          className="execute-btn" 
          onClick={executeAction}
          disabled={!selectedAction || !isPlayerTurn || (selectedAction && actions.find(a => a.id === selectedAction)?.cost > actionPoints)}
        >
          执行行动
        </button>
      </div>
    </div>
  )
}

export default ActionPanel