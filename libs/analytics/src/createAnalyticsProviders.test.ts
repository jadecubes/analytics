import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsPlatforms } from './core/Analytics'

// Each test gets a fresh module, so instances from one test don't leak into the next
const loadModule = () => import('./createAnalyticsProviders')

describe('createAnalyticsProviders', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does nothing without a window, instead of throwing', async () => {
    const { createAnalyticsProviders } = await loadModule()
    vi.stubGlobal('window', undefined)

    expect(() => createAnalyticsProviders({ [AnalyticsPlatforms.GA]: { measurementId: 'G-SSR' } })).not.toThrow()
  })

  it('returns only the platforms it set up', async () => {
    const { createAnalyticsProviders, getAnalyticsInstance } = await loadModule()

    createAnalyticsProviders({ [AnalyticsPlatforms.GA]: { measurementId: 'G-APP' } })

    expect(getAnalyticsInstance(AnalyticsPlatforms.GA)?.measurementId).toBe('G-APP')
    expect(getAnalyticsInstance(AnalyticsPlatforms.TIKTOK)).toBeUndefined()
  })

  it('keeps the first instance and warns when set up again with another id', async () => {
    const { createAnalyticsProviders, getAnalyticsInstance } = await loadModule()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createAnalyticsProviders({ [AnalyticsPlatforms.META]: { measurementId: 'META-1' } })
    const first = getAnalyticsInstance(AnalyticsPlatforms.META)

    createAnalyticsProviders({ [AnalyticsPlatforms.META]: { measurementId: 'META-1' } })
    expect(warnSpy).not.toHaveBeenCalled()
    createAnalyticsProviders({ [AnalyticsPlatforms.META]: { measurementId: 'META-2' } })

    expect(getAnalyticsInstance(AnalyticsPlatforms.META)).toBe(first)
    expect(warnSpy).toHaveBeenCalledOnce()
  })
})
