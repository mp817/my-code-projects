import React from 'react'
import '../styles/StartScreen.css'

type StartScreenProps = {
  onStartGame: (faction: 'china' | 'usa') => void
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="game-title">重生之毛衣帝国</h1>
        <p className="game-subtitle">中美贸易战背景下的经济战略对抗</p>
        
        <div className="game-description">
          <p>在这个回合制策略游戏中，你将扮演中国或美国的领导人，</p>
          <p>在经济、政治、科技和军事领域展开激烈的战略对抗。</p>
          <p>每个决策都将影响国家的未来，最终决定世界格局！</p>
        </div>
        
        <h2 className="faction-title">选择你的阵营</h2>
        
        <div className="faction-selection">
          <div className="faction-card" onClick={() => onStartGame('china')}>
            <div className="faction-icon china-icon">🇨🇳</div>
            <h3>中国阵营</h3>
            <p className="leader-name">领导人: 习大大</p>
            <ul className="faction-traits">
              <li>制造业优势</li>
              <li>人口红利</li>
              <li>基建狂魔</li>
              <li>科技追赶者</li>
            </ul>
            <button className="faction-button china-button">选择中国</button>
          </div>
          
          <div className="faction-card" onClick={() => onStartGame('usa')}>
            <div className="faction-icon usa-icon">🇺🇸</div>
            <h3>美国阵营</h3>
            <p className="leader-name">领导人: 川宝</p>
            <ul className="faction-traits">
              <li>科技领先</li>
              <li>军事霸权</li>
              <li>金融中心</li>
              <li>盟友网络</li>
            </ul>
            <button className="faction-button usa-button">选择美国</button>
          </div>
        </div>
        
        <div className="game-rules">
          <h3>游戏规则</h3>
          <p>- 回合限制: 最大300回合</p>
          <p>- 每回合代表1个月时间</p>
          <p>- 随机国际事件将影响游戏进程</p>
          <p>- 多种胜利路径: 经济、政治、军事、科技</p>
        </div>
      </div>
    </div>
  )
}

export default StartScreen