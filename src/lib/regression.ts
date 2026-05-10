export interface RegressionResult {
  slope: number
  intercept: number
}

export function linearRegression(
  points: { x: number; y: number }[]
): RegressionResult | null {
  if (points.length < 2) return null

  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.x, 0)
  const sumY = points.reduce((acc, p) => acc + p.y, 0)
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0)

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// xOffset: the x-value corresponding to referenceDate (the last actual data point's index)
// Solve for days from referenceDate to when regression line hits target weight
export function projectDate(
  regression: RegressionResult,
  target: number,
  referenceDate: Date,
  xOffset: number
): Date | null {
  const { slope, intercept } = regression

  if (slope >= 0) return null
  const currentY = slope * xOffset + intercept
  if (currentY <= target) return null

  const xTarget = (target - intercept) / slope
  const daysFromReference = Math.ceil(xTarget - xOffset)

  if (daysFromReference <= 0) return null

  const result = new Date(referenceDate)
  result.setDate(result.getDate() + daysFromReference)
  return result
}
