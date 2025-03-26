import React, { useState } from 'react'
import '../../styles/game/StatusPanel.css'

type StatCategory = 'economy' | 'politics' | 'technology' | 'military'

type PlayerStats = {
  economy: {
    gdp: number
    growth: number
    inflation: number
    unemployment: number
    tradeBalance: number
  }
  politics: {
    stability: number
    approval: number
    internationalInfluence: number
    allies: string[]
  }
  technology: {
    researchPoints: number
    completedTechs: string[]
    currentResearch: string | null
    researchProgress: number
  }
  military: {
    strength: number
    readiness: number
    nuclearCapability: number
    cyberCapability: number
  }
}

type StatusPanelProps = {
  playerStats: PlayerStats
  opponentStats: PlayerStats
}

const StatusPanel: React.FC<StatusPanelProps> = ({ playerStats, opponentStats }) => {
  const [activeTab, setActiveTab] = useState<StatCategory>('economy')
  
  // 格式化数字显示
  const formatNumber = (num: number, prefix: string = '') => {
    return `${prefix}${num.toLocaleString(undefined, { maximumFractionDigits: 1 })}`
  }
  
  // 格式化百分比显示
  const formatPercent = (num: number) => {
    const sign = num > 0 ? '+' : ''
    return `${sign}${num.toFixed(1)}%`
  }
  
  // 渲染经济数据
  const renderEconomyStats = () => (
    <div className="stats-content">
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">GDP (万亿)</div>
          <div className="stat-value">{formatNumber(playerStats.economy.gdp, '$')}</div>
          <div className="stat-comparison">
            {playerStats.economy.gdp > opponentStats.economy.gdp ? '领先' : '落后'}
            {Math.abs(((playerStats.economy.gdp / opponentStats.economy.gdp) - 1) * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">经济增长</div>
          <div className="stat-value">{formatPercent(playerStats.economy.growth)}</div>
          <div className="stat-comparison">
            vs 对手 {formatPercent(opponentStats.economy.growth)}
          </div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">通货膨胀</div>
          <div className="stat-value">{formatPercent(playerStats.economy.inflation)}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">失业率</div>
          <div className="stat-value">{formatPercent(playerStats.economy.unemployment)}</div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-item wide">
          <div className="stat-label">贸易平衡 (十亿)</div>
          <div className={`stat-value ${playerStats.economy.tradeBalance >= 0 ? 'positive' : 'negative'}`}>
            {formatNumber(playerStats.economy.tradeBalance, '$')}
          </div>
        </div>
      </div>
    </div>
  )
  
  // 渲染政治数据
  const renderPoliticsStats = () => (
    <div className="stats-content">
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">稳定度</div>
          <div className="stat-value">{playerStats.politics.stability}%</div>
          <div className="stat-comparison">
            {playerStats.politics.stability > opponentStats.politics.stability ? '领先' : '落后'}
            {Math.abs(playerStats.politics.stability - opponentStats.politics.stability)}%
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">支持率</div>
          <div className="stat-value">{playerStats.politics.approval}%</div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-item wide">
          <div className="stat-label">国际影响力</div>
          <div className="stat-value">{playerStats.politics.internationalInfluence}/100</div>
          <div className="stat-comparison">
            vs 对手 {opponentStats.politics.internationalInfluence}/100
          </div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-item wide">
          <div className="stat-label">盟友</div>
          <div className="allies-list">
            {playerStats.politics.allies.map((ally, index) => (
              <span key={index} className="ally-tag">{ally}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
  
  // 渲染科技数据
  const renderTechnologyStats = () => (
    <div className="stats-content">
      <div className="stats-row">
        <div className="stat-item wide">
          <div className="stat-label">研发点数</div>
          <div className="stat-value">{playerStats.technology.researchPoints}</div>
          <div className="stat-comparison">
            vs 对手 {opponentStats.technology.researchPoints}
          </div>
        </div>
      </div>
      
      {playerStats.technology.currentResearch && (
        <div className="stats-row">
          <div className="stat-item wide">
            <div className="stat-label">当前研究</div>
            <div className="tech-progress">
              <div className="tech-name">{playerStats.technology.currentResearch}</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${playerStats.technology.researchProgress}%` }}
                ></div>
              </div>
              <div>{playerStats.technology.researchProgress}% 完成</div>
            </div>
          </div>
        </div>
      )}
      
      {playerStats.technology.completedTechs.length > 0 && (
        <div className="stats-row">
          <div className="stat-item wide">
            <div className="stat-label">已完成研究</div>
            <div className="tech-list">
              {playerStats.technology.completedTechs.map((tech, index) => (
                <div key={index} className="tech-item">{tech}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
  
  // 渲染军事数据
  const renderMilitaryStats = () => (
    <div className="stats-content">
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">军事实力</div>
          <div className="stat-value">{playerStats.military.strength}/100</div>
          <div className="stat-comparison">
            {playerStats.military.strength > opponentStats.military.strength ? '领先' : '落后'}
            {Math.abs(playerStats.military.strength - opponentStats.military.strength)}%
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">战备等级</div>
          <div className="stat-value">{playerStats.military.readiness}%</div>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">核能力</div>
          <div className="stat-value">{playerStats.military.nuclearCapability}/100</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">网络能力</div>
          <div className="stat-value">{playerStats.military.cyberCapability}/100</div>
        </div>
      </div>
    </div>
  )
  
  // 根据当前活动标签渲染对应的统计数据
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'economy':
        return renderEconomyStats()
      case 'politics':
        return renderPoliticsStats()
      case 'technology':
        return renderTechnologyStats()
      case 'military':
        return renderMilitaryStats()
      default:
        return renderEconomyStats()
    }
  }
  
  return (
    <div className="status-panel">
      <h2 className="status-title">国家状态</h2>
      
      <div className="status-tabs">
        <div 
          className={`status-tab ${activeTab === 'economy' ? 'active' : ''}`}
          onClick={() => setActiveTab('economy')}
        >
          经济
        </div>
        <div 
          className={`status-tab ${activeTab === 'politics' ? 'active' : ''}`}
          onClick={() => setActiveTab('politics')}
        >
          政治
        </div>
        <div 
          className={`status-tab ${activeTab === 'technology' ? 'active' : ''}`}
          onClick={() => setActiveTab('technology')}
        >
          科技
        </div>
        <div 
          className={`status-tab ${activeTab === 'military' ? 'active' : ''}`}
          onClick={() => setActiveTab('military')}
        >
          军事
        </div>
      </div>
      
      {renderActiveTabContent()}
    </div>
  )
}

export default StatusPanel