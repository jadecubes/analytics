import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsPlatforms } from './core/Analytics'
import { Ga } from './core/Ga'
import { createAnalyticsProviders, getAnalyticsInstance } from './createAnalyticsProviders'

describe('createAnalyticsProviders', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('test_withoutWindow_doesNothingInsteadOfThrowing', () => {
    vi.stubGlobal('window', undefined)

    expect(() => createAnalyticsProviders({ [AnalyticsPlatforms.GA]: { measurementId: 'G-SSR' } })).not.toThrow()
  })

  it('test_configuredPlatform_isReturnedByGetAnalyticsInstance', () => {
    expect(getAnalyticsInstance(AnalyticsPlatforms.TIKTOK)).toBeUndefined()

    createAnalyticsProviders({ [AnalyticsPlatforms.GA]: { measurementId: 'G-APP' } })

    expect(getAnalyticsInstance(AnalyticsPlatforms.GA)).toBeInstanceOf(Ga)
    expect(getAnalyticsInstance(AnalyticsPlatforms.TIKTOK)).toBeUndefined()
  })
})
