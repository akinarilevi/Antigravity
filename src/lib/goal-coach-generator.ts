/**
 * AI Goal Coach Generator
 * Claude APIを使用して毎朝のゴール達成支援レポートを生成
 */

export interface GoalCoachInput {
  targetAge: number
  targetAsset: number // JPY
  currentAsset: number // JPY
  successProbability: number // %
  previousSuccessProbability: number // 前日の確率
  projectedAssetAtTarget: number // 目標年齢での予測資産
  yearsToTarget: number
  marketCycle: string // 現在の市場サイクル
  riskScore: number // 0-100
  dailyChange: number // JPY
  mainContributions: string[] // 主な増加要因
}

export interface GoalCoachReport {
  content: string
  successProbability: number
  probabilityChange: number // 前日比
  recommendation: string
  emotionalTone: 'positive' | 'neutral' | 'alert'
}

/**
 * Claude APIを使用してGoal Coachレポートを生成
 */
export async function generateGoalCoachReport(
  input: GoalCoachInput,
  apiKey: string
): Promise<GoalCoachReport> {
  const prompt = buildPrompt(input)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content =
      data.content[0].type === 'text' ? data.content[0].text : 'Unable to generate report'

    // 感情トーンを判定
    const emotionalTone = determineEmotionalTone(input.successProbability)

    // 推奨アクションを生成
    const recommendation = generateRecommendation(input)

    return {
      content,
      successProbability: input.successProbability,
      probabilityChange: input.successProbability - input.previousSuccessProbability,
      recommendation,
      emotionalTone,
    }
  } catch (error) {
    console.error('Failed to generate Goal Coach report:', error)
    throw error
  }
}

/**
 * Claude APIへのプロンプトを構築
 */
function buildPrompt(input: GoalCoachInput): string {
  const probabilityChange = input.successProbability - input.previousSuccessProbability
  const changeStr =
    probabilityChange >= 0
      ? `+${probabilityChange.toFixed(1)}%`
      : `${probabilityChange.toFixed(1)}%`

  return `You are a personal wealth advisor providing a brief morning motivation report for a user pursuing their financial goals.

【ユーザーの目標】
${input.targetAge}歳までに¥${(input.targetAsset / 100000000).toFixed(1)}億円達成

【現在の状況】
- 現在資産: ¥${(input.currentAsset / 10000).toFixed(0)}万円
- 達成確率: ${input.successProbability.toFixed(0)}% (前日比: ${changeStr})
- ${input.targetAge}歳時点予測資産: ¥${(input.projectedAssetAtTarget / 100000000).toFixed(2)}億円
- 残り期間: ${input.yearsToTarget}年
- 市場環境: ${input.marketCycle}
- 今日の資産変化: ${input.dailyChange >= 0 ? '+' : ''}¥${(input.dailyChange / 10000).toFixed(1)}万円

【主な増加要因】
${input.mainContributions.map((c) => `- ${c}`).join('\n')}

Generate a brief, motivational morning report in Japanese (2-3 sentences max) that:
1. Acknowledges the current probability and any change
2. Provides encouragement or actionable insight
3. Keeps a positive, supportive tone

Be concise and natural, as if from a trusted financial advisor.`
}

/**
 * 感情トーンを判定
 */
function determineEmotionalTone(probability: number): 'positive' | 'neutral' | 'alert' {
  if (probability >= 80) return 'positive'
  if (probability >= 60) return 'neutral'
  return 'alert'
}

/**
 * 推奨アクションを生成
 */
function generateRecommendation(input: GoalCoachInput): string {
  if (input.successProbability >= 90) {
    return '現在のペースを維持してください。目標達成は見込みが高い状態です。'
  }

  if (input.successProbability >= 80) {
    return '現在のペースで推移すれば目標達成が見込めます。特に追加投資は不要ですが、市場環境には注視してください。'
  }

  if (input.successProbability >= 70) {
    return '目標達成に向けて順調ですが、年間追加投資額の増加を検討してみてください。'
  }

  if (input.successProbability >= 60) {
    return '目標達成には追加的な対策が必要です。年間追加投資額を増やすか、ポートフォリオをより高リターン志向にリバランスすることを推奨します。'
  }

  return '目標達成には大幅な対策が必要です。キャッシュフロー分析を見直し、年間投資額の大幅増加またはリスク資産の比率向上を検討してください。'
}

/**
 * 簡潔な朝レポート文を生成（フォールバック用）
 */
export function generateFallbackReport(input: GoalCoachInput): GoalCoachReport {
  const probabilityChange = input.successProbability - input.previousSuccessProbability
  const changeStr =
    probabilityChange >= 0
      ? `+${probabilityChange.toFixed(1)}`
      : `${probabilityChange.toFixed(1)}`

  const emotionalTone = determineEmotionalTone(input.successProbability)

  let contentBase = ''
  if (input.successProbability >= 80) {
    contentBase = `おはようございます。\n\n${input.targetAge}歳${(input.targetAsset / 100000000).toFixed(1)}億円達成確率は${input.successProbability.toFixed(0)}%です(前日比: ${changeStr}%)。\n\n目標達成見込みです。現在の戦略を維持してください。`
  } else if (input.successProbability >= 60) {
    contentBase = `おはようございます。\n\n${input.targetAge}歳${(input.targetAsset / 100000000).toFixed(1)}億円達成確率は${input.successProbability.toFixed(0)}%です(前日比: ${changeStr}%)。\n\n現在のペースで推移すれば目標達成が見込めます。`
  } else {
    contentBase = `おはようございます。\n\n${input.targetAge}歳${(input.targetAsset / 100000000).toFixed(1)}億円達成確率は${input.successProbability.toFixed(0)}%です(前日比: ${changeStr}%)。\n\n目標達成には追加的な対策が必要です。`
  }

  return {
    content: contentBase,
    successProbability: input.successProbability,
    probabilityChange,
    recommendation: generateRecommendation(input),
    emotionalTone,
  }
}
