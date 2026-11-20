import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsPlatforms } from './core/Analytics'

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

  it('getAnalyticsInstance returns only the configured platforms', async () => {
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

  it('skips a platform whose id is empty', async () => {
    const { createAnalyticsProviders, getAnalyticsInstance } = await loadModule()

    createAnalyticsProviders({ [AnalyticsPlatforms.GA]: { measurementId: '' } })

    expect(getAnalyticsInstance(AnalyticsPlatforms.GA)).toBeUndefined()
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
  })

  it('keeps setting up the other platforms when one throws during setup', async () => {
    const { createAnalyticsProviders, getAnalyticsInstance } = await loadModule()
    const error = new Error('page fbq is broken')
    window.fbq = () => {
      throw error
    }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => createAnalyticsProviders({
      [AnalyticsPlatforms.META]: { measurementId: 'META-1' },
      [AnalyticsPlatforms.TIKTOK]: { measurementId: 'TT-1' },
    })).not.toThrow()

    expect(errorSpy).toHaveBeenCalledWith('[META] initialize', error)
    expect(getAnalyticsInstance(AnalyticsPlatforms.TIKTOK)?.measurementId).toBe('TT-1')
    window.fbq = undefined
  })
})
