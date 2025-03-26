import React from 'react'
import '../../styles/game/WorldMap.css'
import { GameState, Region } from '../../types/gameTypes'

type WorldMapProps = {
  gameState: GameState
}

const WorldMap: React.FC<WorldMapProps> = ({ gameState }) => {
  const { regions } = gameState.worldState
  
  // 计算地区影响力百分比
  const calculateInfluencePercentage = (region: Region, faction: 'china' | 'usa') => {
    const total = region.influence.china + region.influence.usa
    return (region.influence[faction] / total) * 100
  }
  
  return (
    <div className="world-map-container">
      <h2 className="map-title">世界地图</h2>
      <div className="world-map">
        {regions.map(region => (
          <div key={region.id} className={`region ${region.id}`}>
            <div className="region-header">
              <h3>{region.name}</h3>
              <div className="region-stability">
                稳定度: {region.stability}%
              </div>
            </div>
            
            <div className="influence-bar">
              <div 
                className="china-influence" 
                style={{ width: `${calculateInfluencePercentage(region, 'china')}%` }}
              ></div>
              <div 
                className="usa-influence" 
                style={{ width: `${calculateInfluencePercentage(region, 'usa')}%` }}
              ></div>
            </div>
            
            <div className="region-resources">
              资源: {region.resources.join(', ')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color china-color"></div>
          <span>中国影响力</span>
        </div>
        <div className="legend-item">
          <div className="legend-color usa-color"></div>
          <span>美国影响力</span>
        </div>
      </div>
      
      <div className="global-indicators">
        <div className="indicator">
          <span className="indicator-label">全球经济指数:</span>
          <span className="indicator-value">{gameState.worldState.globalEconomy}</span>
        </div>
        <div className="indicator">
          <span className="indicator-label">全球紧张局势:</span>
          <span className="indicator-value">{gameState.worldState.tensions}</span>
        </div>
        <div className="indicator">
          <span className="indicator-label">气候变化指数:</span>
          <span className="indicator-value">{gameState.worldState.climateChange}</span>
        </div>
      </div>
    </div>
  )
}

export default WorldMap