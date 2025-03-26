// 游戏状态类型定义
export type GameState = {
  player: PlayerStats
  opponent: PlayerStats
  worldState: WorldState
  turn: number
}

// 玩家统计数据
export type PlayerStats = {
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

// 世界状态
export type WorldState = {
  globalEconomy: number // 全球经济指数
  tensions: number // 全球紧张局势指数
  climateChange: number // 气候变化指数
  regions: Region[]
}

// 地区
export type Region = {
  id: string
  name: string
  influence: {
    china: number
    usa: number
  }
  resources: string[]
  stability: number
}

// 玩家行动
export type PlayerAction = {
  type: 'economy' | 'trade' | 'technology' | 'military' | 'diplomacy'
  target?: string
  intensity?: number
  description: string
}

// 事件
export type Event = {
  id: number
  turn: number
  title: string
  description: string
  effect: string
  type: 'positive' | 'negative' | 'neutral'
}

// 科技类型
export type Technology = {
  id: string
  name: string
  description: string
  cost: number
  effects: TechEffect[]
  prerequisites: string[]
}

// 科技效果
export type TechEffect = {
  target: 'economy' | 'politics' | 'military' | 'technology'
  property: string
  value: number
  isPercentage: boolean
}

// 胜利类型
export type VictoryType = 'economic' | 'political' | 'military' | 'technological' | null