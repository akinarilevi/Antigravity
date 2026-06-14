/**
 * Market Cycle Engine
 * 市場環境を6段階で判定し、現在のサイクル段階を決定
 */

export type MarketCycleStage = 'Recovery' | 'Expansion' | 'Peak' | 'Slowdown' | 'Recession' | 'Crisis'

export interface MarketCycleAnalysis {
  stage: MarketCycleStage
  stageScore: number // 0-100: 段階内での位置
  confidence: number // 0-100: 判定の信頼度
  signals: {
    sp500Trend: string
    sp500Performance: number // 過去3ヶ月のリターン %
    vixLevel: number
    gdpGrowth: number // %
    earningsGrowth: number // %
    unemploymentRate: number // %
    inflationRate: number // %
  }
  recommendation: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  positionAdjustment: string // ポートフォリオ調整提案
}

/**
 * 市場サイクル段階を判定
 */
export function analyzeMarketCycle(marketData: {
  sp500Trend3m: number // 過去3ヶ月リターン %
  vixLevel: number
  gdpGrowth: number
  earningsGrowth: number
  unemploymentRate: number
  inflationRate: number
  perRatio: number // PER (Price Earnings Ratio)
  creditSpreadBps: number // bp
}): MarketCycleAnalysis {
  let stage: MarketCycleStage = 'Expansion'
  let stageScore = 50
  let confidence = 70

  // 各段階の判定ロジック
  if (isRecoveryStage(marketData)) {
    stage = 'Recovery'
    stageScore = 30
    confidence = 80
  } else if (isPeakStage(marketData)) {
    stage = 'Peak'
    stageScore = 70
    confidence = 75
  } else if (isSlowdownStage(marketData)) {
    stage = 'Slowdown'
    stageScore = 60
    confidence = 70
  } else if (isRecessionStage(marketData)) {
    stage = 'Recession'
    stageScore = 80
    confidence = 85
  } else if (isCrisisStage(marketData)) {
    stage = 'Crisis'
    stageScore = 95
    confidence = 90
  } else {
    stage = 'Expansion'
    stageScore = 50
    confidence = 65
  }

  const riskLevel = getRiskLevel(stage)
  const recommendation = getRecommendation(stage)
  const positionAdjustment = getPositionAdjustment(stage)

  return {
    stage,
    stageScore,
    confidence,
    signals: {
      sp500Trend: marketData.sp500Trend3m >= 0 ? 'Uptrend' : 'Downtrend',
      sp500Performance: marketData.sp500Trend3m,
      vixLevel: marketData.vixLevel,
      gdpGrowth: marketData.gdpGrowth,
      earningsGrowth: marketData.earningsGrowth,
      unemploymentRate: marketData.unemploymentRate,
      inflationRate: marketData.inflationRate,
    },
    riskLevel,
    recommendation,
    positionAdjustment,
  }
}

/**
 * Recovery (回復局面)
 * 底値からの上昇開始
 */
function isRecoveryStage(data: any): boolean {
  // 過去3ヶ月が -10% 未満で、最近1ヶ月が +5% 以上
  // VIX が下降トレンド
  // 失業率がまだ上昇中
  return (
    data.sp500Trend3m < -10 &&
    data.vixLevel > 25 &&
    data.vixLevel < 30 &&
    data.gdpGrowth < 1
  )
}

/**
 * Peak (過熱局面)
 * 過度な上昇
 */
function isPeakStage(data: any): boolean {
  // PER が 23 以上
  // 3ヶ月以上 +20% 以上の上昇継続
  // 限界企業の上場増加
  // クレジットスプレッドが極度に狭い
  return (
    data.perRatio > 23 &&
    data.sp500Trend3m > 20 &&
    data.creditSpreadBps < 100 &&
    data.vixLevel < 15
  )
}

/**
 * Slowdown (減速局面)
 * 経済成長率鈍化
 */
function isSlowdownStage(data: any): boolean {
  // GDP 成長率が 2% - 0.5%
  // 企業利益成長率が減速
  // VIX 上昇トレンド
  // イールドカーブがフラット化
  return (
    data.gdpGrowth >= 0.5 &&
    data.gdpGrowth < 2 &&
    data.earningsGrowth < 5 &&
    data.vixLevel > 15 &&
    data.vixLevel < 22
  )
}

/**
 * Recession (景気後退局面)
 * GDP マイナス成長
 */
function isRecessionStage(data: any): boolean {
  // GDP < 0%
  // 失業率が上昇
  // VIX が高い（22-35）
  return (
    data.gdpGrowth < 0 &&
    data.unemploymentRate > 4 &&
    data.vixLevel > 22 &&
    data.vixLevel < 35
  )
}

/**
 * Crisis (危機局面)
 * 急激な市場下落
 */
function isCrisisStage(data: any): boolean {
  // VIX > 35
  // 連続赤字
  // クレジットスプレッド 極度に拡大
  return data.vixLevel > 35 || data.creditSpreadBps > 500
}

/**
 * リスクレベルを判定
 */
function getRiskLevel(stage: MarketCycleStage): 'Low' | 'Medium' | 'High' | 'Very High' {
  switch (stage) {
    case 'Recovery':
      return 'High'
    case 'Expansion':
      return 'Low'
    case 'Peak':
      return 'Medium'
    case 'Slowdown':
      return 'Medium'
    case 'Recession':
      return 'High'
    case 'Crisis':
      return 'Very High'
    default:
      return 'Medium'
  }
}

/**
 * アドバイスを生成
 */
function getRecommendation(stage: MarketCycleStage): string {
  const recommendations: Record<MarketCycleStage, string> = {
    Recovery: '市場は回復初期段階です。徐々にリスク資産を増やすタイミングです。',
    Expansion: '拡大局面の最中です。現在のポートフォリオを維持し、定期的なリバランスを実施してください。',
    Peak: '市場は過熱している可能性があります。利益確定とリスク低減を検討してください。',
    Slowdown: '経済成長が鈍化しています。ディフェンシブ資産の比率を増やすことをお勧めします。',
    Recession: '景気後退の兆候が見られます。現金やディフェンシブ資産の比率を増やし、リスクを低減してください。',
    Crisis: '市場は危機的状況です。ポートフォリオを守ることを最優先にしてください。',
  }
  return recommendations[stage]
}

/**
 * ポートフォリオ調整提案
 */
function getPositionAdjustment(stage: MarketCycleStage): string {
  const adjustments: Record<MarketCycleStage, string> = {
    Recovery: 'リスク資産: 60% → 70% | 現金・債券: 40% → 30%',
    Expansion: 'リスク資産: 70% | 現金・債券: 30% (維持)',
    Peak: 'リスク資産: 70% → 60% | 現金・債券: 30% → 40%',
    Slowdown: 'リスク資産: 60% | 現金・債券: 40% (維持)',
    Recession: 'リスク資産: 60% → 40% | 現金・債券: 40% → 60%',
    Crisis: 'リスク資産: 40% → 20% | 現金・債券: 60% → 80%',
  }
  return adjustments[stage]
}

/**
 * 市場サイクル段階の説明
 */
export function getStageDescription(stage: MarketCycleStage): {
  name: string
  ja_name: string
  description: string
} {
  const descriptions: Record<
    MarketCycleStage,
    { name: string; ja_name: string; description: string }
  > = {
    Recovery: {
      name: 'Recovery',
      ja_name: '回復局面',
      description: '底値からの上昇が開始された段階。VIX が低下し始める。',
    },
    Expansion: {
      name: 'Expansion',
      ja_name: '拡大局面',
      description: '安定的な経済成長と企業利益増加が続く。最も相場が強い段階。',
    },
    Peak: {
      name: 'Peak',
      ja_name: '過熱局面',
      description: '過度な上昇が続き、バリュエーション高騰。調整リスクが高い。',
    },
    Slowdown: {
      name: 'Slowdown',
      ja_name: '減速局面',
      description: '経済成長率が鈍化し、企業利益伸び率が低下。景気後退への前兆。',
    },
    Recession: {
      name: 'Recession',
      ja_name: '景気後退局面',
      description: 'GDP がマイナス成長。失業率上昇。相場下落。',
    },
    Crisis: {
      name: 'Crisis',
      ja_name: '危機局面',
      description: '急激な市場下落。VIX > 35。金融危機や暴落。',
    },
  }
  return descriptions[stage]
}
