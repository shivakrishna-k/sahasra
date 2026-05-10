import { describe, it, expect } from 'vitest'
import { linearRegression, projectDate } from '../lib/regression'

describe('linearRegression', () => {
  it('returns slope and intercept for a simple dataset', () => {
    const points = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ]
    const result = linearRegression(points)
    expect(result!.slope).toBeCloseTo(2, 5)
    expect(result!.intercept).toBeCloseTo(1, 5)
  })

  it('returns null for fewer than 2 points', () => {
    expect(linearRegression([{ x: 0, y: 58 }])).toBeNull()
    expect(linearRegression([])).toBeNull()
  })

  it('handles a declining weight trend', () => {
    const points = [
      { x: 0, y: 60 },
      { x: 7, y: 59.3 },
      { x: 14, y: 58.6 },
    ]
    const result = linearRegression(points)
    expect(result!.slope).toBeCloseTo(-0.1, 1)
  })
})

describe('projectDate', () => {
  it('returns projected date when target is reachable', () => {
    const referenceDate = new Date('2026-05-10')
    const result = projectDate({ slope: -0.1, intercept: 58 }, 54, referenceDate, 0)
    expect(result).not.toBeNull()
    expect(result!.toISOString().slice(0, 10)).toBe('2026-06-19')
  })

  it('handles non-zero xOffset correctly', () => {
    const referenceDate = new Date('2026-05-20')
    const result = projectDate({ slope: -0.1, intercept: 58 }, 54, referenceDate, 10)
    expect(result).not.toBeNull()
    expect(result!.toISOString().slice(0, 10)).toBe('2026-06-19')
  })

  it('returns null when slope is zero or positive (not losing weight)', () => {
    const referenceDate = new Date('2026-05-10')
    expect(projectDate({ slope: 0, intercept: 58 }, 54, referenceDate, 0)).toBeNull()
    expect(projectDate({ slope: 0.05, intercept: 58 }, 54, referenceDate, 0)).toBeNull()
  })

  it('returns null when already at or below target', () => {
    const referenceDate = new Date('2026-05-20')
    expect(projectDate({ slope: -0.1, intercept: 54 }, 54, referenceDate, 10)).toBeNull()
  })
})
