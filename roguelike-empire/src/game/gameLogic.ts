import { GameState, PlayerStats, WorldState, Event, Region } from '../types/gameTypes'

// 初始化游戏状态
export const generateInitialState = (faction: 'china' | 'usa'): GameState => {
  // 创建初始世界状态
  const worldState: WorldState = {
    globalEconomy: 100,
    tensions: 50,
    climateChange: 30,
    regions: generateRegions()
  }
  
  // 根据玩家选择的阵营创建玩家和对手的初始状态
  let playerStats: PlayerStats
  let opponentStats: PlayerStats
  
  if (faction === 'china') {
    playerStats = generateChinaStats()
    opponentStats = generateUSAStats()
  } else {
    playerStats = generateUSAStats()
    opponentStats = generateChinaStats()
  }
  
  return {
    player: playerStats,
    opponent: opponentStats,
    worldState,
    turn: 1
  }
}

// 生成中国初始状态
const generateChinaStats = (): PlayerStats => {
  return {
    economy: {
      gdp: 14.7, // 万亿美元
      growth: 5.5, // 百分比
      inflation: 2.1,
      unemployment: 5.2,
      tradeBalance: 300 // 十亿美元
    },
    politics: {
      stability: 80,
      approval: 75,
      internationalInfluence: 60,
      allies: ['Russia', 'Pakistan', 'Iran', 'North Korea']
    },
    technology: {
      researchPoints: 0,
      completedTechs: [],
      currentResearch: null,
      researchProgress: 0
    },
    military: {
      strength: 70,
      readiness: 65,
      nuclearCapability: 50,
      cyberCapability: 75
    }
  }
}

// 生成美国初始状态
const generateUSAStats = (): PlayerStats => {
  return {
    economy: {
      gdp: 21.4, // 万亿美元
      growth: 2.2, // 百分比
      inflation: 1.8,
      unemployment: 3.7,
      tradeBalance: -800 // 十亿美元，贸易逆差
    },
    politics: {
      stability: 70,
      approval: 55,
      internationalInfluence: 85,
      allies: ['UK', 'EU', 'Japan', 'South Korea', 'Australia']
    },
    technology: {
      researchPoints: 0,
      completedTechs: [],
      currentResearch: null,
      researchProgress: 0
    },
    military: {
      strength: 90,
      readiness: 80,
      nuclearCapability: 85,
      cyberCapability: 90
    }
  }
}

// 生成世界地区
const generateRegions = (): Region[] => {
  return [
    {
      id: 'east_asia',
      name: '东亚',
      influence: { china: 70, usa: 50 },
      resources: ['electronics', 'manufacturing'],
      stability: 75
    },
    {
      id: 'europe',
      name: '欧洲',
      influence: { china: 40, usa: 75 },
      resources: ['finance', 'technology'],
      stability: 80
    },
    {
      id: 'middle_east',
      name: '中东',
      influence: { china: 55, usa: 60 },
      resources: ['oil', 'gas'],
      stability: 40
    },
    {
      id: 'africa',
      name: '非洲',
      influence: { china: 65, usa: 45 },
      resources: ['minerals', 'agriculture'],
      stability: 50
    },
    {
      id: 'south_america',
      name: '南美',
      influence: { china: 50, usa: 65 },
      resources: ['agriculture', 'minerals'],
      stability: 60
    },
    {
      id: 'north_america',
      name: '北美',
      influence: { china: 30, usa: 90 },
      resources: ['technology', 'finance'],
      stability: 85
    },
    {
      id: 'oceania',
      name: '大洋洲',
      influence: { china: 45, usa: 70 },
      resources: ['minerals', 'agriculture'],
      stability: 90
    }
  ]
}

// 处理AI回合
export const processAITurn = (state: GameState): { newState: GameState, event: Event | null } => {
  const newState = { ...state }
  let event: Event | null = null
  
  // 简单的AI决策逻辑
  // 根据当前状态选择最优的行动
  
  // 如果经济增长低，优先发展经济
  if (newState.opponent.economy.growth < 3) {
    newState.opponent.economy.growth += 0.3
    newState.opponent.economy.gdp *= 1.03
    
    event = {
      id: Date.now(),
      turn: state.turn,
      title: '对手发展经济',
      description: '你的对手实施了一系列经济刺激政策，促进了经济增长。',
      effect: 'GDP +3%, 增长率 +0.3%',
      type: 'neutral'
    }
  }
  // 如果军事实力落后，加强军事
  else if (newState.opponent.military.strength < newState.player.military.strength) {
    newState.opponent.military.strength += 5
    newState.opponent.military.readiness += 3
    
    event = {
      id: Date.now(),
      turn: state.turn,
      title: '对手军事扩张',
      description: '你的对手增加了军事预算，提升了军事实力。',
      effect: '军事实力 +5, 军事准备度 +3',
      type: 'negative'
    }
  }
  // 如果科技落后，投资科技
  else if (newState.opponent.technology.researchPoints < newState.player.technology.researchPoints) {
    newState.opponent.technology.researchPoints += 15
    
    // 检查是否可以完成科技
    if (newState.opponent.technology.researchPoints >= 100 && 
        newState.opponent.technology.completedTechs.length < 3) {
      const newTech = `Advanced Technology ${newState.opponent.technology.completedTechs.length + 1}`
      newState.opponent.technology.completedTechs.push(newTech)
      newState.opponent.technology.researchPoints -= 100
      
      event = {
        id: Date.now(),
        turn: state.turn,
        title: '对手科技突破',
        description: `你的对手完成了${newTech}的研发，获得了技术优势。`,
        effect: '完成一项新科技',
        type: 'negative'
      }
    } else {
      event = {
        id: Date.now(),
        turn: state.turn,
        title: '对手科研投入',
        description: '你的对手增加了科研经费，加速了技术研发。',
        effect: '研发点数 +15',
        type: 'neutral'
      }
    }
  }
  // 否则，提升国际影响力
  else {
    newState.opponent.politics.internationalInfluence += 3
    
    event = {
      id: Date.now(),
      turn: state.turn,
      title: '对手外交攻势',
      description: '你的对手展开了一系列外交活动，提升了国际影响力。',
      effect: '国际影响力 +3',
      type: 'neutral'
    }
  }
  
  // 随机事件
  if (Math.random() < 0.2) {
    const randomEvent = generateRandomAIEvent(newState)
    if (randomEvent) {
      // 应用随机事件效果
      applyEventEffect(newState, randomEvent)
      event = randomEvent
    }
  }
  
  // 更新回合数
  newState.turn += 1
  
  return { newState, event }
}

// 生成随机AI事件
const generateRandomAIEvent = (state: GameState): Event | null => {
  const eventTypes = ['positive', 'negative', 'neutral']
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as 'positive' | 'negative' | 'neutral'
  
  // 根据事件类型生成不同的事件
  switch (eventType) {
    case 'positive':
      return {
        id: Date.now(),
        turn: state.turn,
        title: '国际市场利好',
        description: '国际市场出现利好因素，对手的经济受益。',
        effect: '对手GDP +2%',
        type: 'negative' // 对手的正面事件对玩家来说是负面的
      }
    case 'negative':
      return {
        id: Date.now(),
        turn: state.turn,
        title: '对手内部动荡',
        description: '对手国内出现政治动荡，影响了经济和社会稳定。',
        effect: '对手稳定度 -5, GDP -1%',
        type: 'positive' // 对手的负面事件对玩家来说是正面的
      }
    case 'neutral':
      return {
        id: Date.now(),
        turn: state.turn,
        title: '全球气候变化',
        description: '全球气候变化加剧，各国面临新的挑战。',
        effect: '全球气候变化指数 +2',
        type: 'neutral'
      }
    default:
      return null;
  }
}

// 应用事件效果
const applyEventEffect = (state: GameState, event: Event): void => {
  // 根据事件类型应用不同的效果
  switch (event.type) {
    case 'positive':
      // 正面事件增强玩家状态
      state.player.economy.gdp *= 1.02;
      break;
    case 'negative':
      // 负面事件减弱玩家状态
      state.player.politics.stability -= 5;
      state.player.economy.gdp *= 0.99;
      break;
    case 'neutral':
      // 中性事件影响世界状态
      state.worldState.climateChange += 2;
      break;
    default:
      // 处理未知事件类型
      console.warn(`未知事件类型: ${event.type}`);
      break;
      break;
  }
}