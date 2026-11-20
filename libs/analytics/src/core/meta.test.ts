import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Meta } from './Meta'

const measurementId = 'META-TEST'

describe('Meta', () => {
  beforeEach(() => {
    window.fbq = undefined
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('injects Meta\'s base code once per pixel id', () => {
    new Meta({ measurementId })
    new Meta({ measurementId })

    const snippets = document.querySelectorAll(`script[data-id="meta-pixel-${measurementId}"]`)
    expect(snippets).toHaveLength(1)
    expect(snippets[0].textContent).toContain('connect.facebook.net/en_US/fbevents.js')
  })

  it('initializes its pixel and sends PageView to it, also beside a pixel the page already loaded', () => {
    const pageFbq = vi.fn()
    window.fbq = pageFbq

    new Meta({ measurementId })

    expect(pageFbq).toHaveBeenNthCalledWith(1, 'init', measurementId)
    expect(pageFbq).toHaveBeenNthCalledWith(2, 'trackSingle', measurementId, 'PageView')
  })

  it('sends a standard event to its pixel only, with trackSingle', () => {
    const meta = new Meta({ measurementId })
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    meta.processAnalyticsEvent({ eventName: 'Purchase', eventParams: { value: 10 } })

    expect(mockFbq).toHaveBeenCalledWith('trackSingle', measurementId, 'Purchase', { value: 10 })
  })

  it('sends any other event name with trackSingleCustom', () => {
    const meta = new Meta({ measurementId })
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    meta.processAnalyticsEvent({ eventName: 'ShareCampaign', eventParams: { method: 'line' } })

    expect(mockFbq).toHaveBeenCalledWith('trackSingleCustom', measurementId, 'ShareCampaign', { method: 'line' })
  })

  it('passes eventId as eventID for deduplication', () => {
    const meta = new Meta({ measurementId })
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    meta.processAnalyticsEvent({ eventName: 'Purchase', eventParams: {}, eventId: 'order-1' })

    expect(mockFbq).toHaveBeenCalledWith('trackSingle', measurementId, 'Purchase', {}, { eventID: 'order-1' })
  })

  it('logs an error when fbq is missing', () => {
    const meta = new Meta({ measurementId })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    meta.processAnalyticsEvent({ eventName: 'Purchase', eventParams: {} })

    expect(errorSpy).toHaveBeenCalledWith('[META] fbq is not defined')
  })
})
