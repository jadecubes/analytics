import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TikTok } from './Tiktok'

const measurementId = 'TT-TEST'

const mockTtq = () => {
  const pixel = { track: vi.fn(), page: vi.fn() }
  const instance = vi.fn(() => pixel)
  const load = vi.fn()
  window.ttq = { load, instance }
  return { load, instance, pixel }
}

describe('TikTok', () => {
  beforeEach(() => {
    window.ttq = undefined
    document.head.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('injects the pixel code once per pixel id, loading that id', () => {
    new TikTok({ measurementId })
    new TikTok({ measurementId })

    const snippets = document.querySelectorAll(`script[data-id="tiktok-pixel-${measurementId}"]`)
    expect(snippets).toHaveLength(1)
    expect(snippets[0].textContent).toContain(`ttq.load('${measurementId}')`)
  })

  it('sends events to its own pixel only', () => {
    const tiktok = new TikTok({ measurementId })
    const { instance, pixel } = mockTtq()

    tiktok.processAnalyticsEvent({ eventName: 'CompletePayment', eventParams: { value: 10 } })

    expect(instance).toHaveBeenCalledWith(measurementId)
    expect(pixel.track).toHaveBeenCalledWith('CompletePayment', { value: 10 })
  })

  it('passes eventId as event_id for deduplication', () => {
    const tiktok = new TikTok({ measurementId })
    const { pixel } = mockTtq()

    tiktok.processAnalyticsEvent({ eventName: 'CompletePayment', eventParams: {}, eventId: 'order-1' })

    expect(pixel.track).toHaveBeenCalledWith('CompletePayment', {}, { event_id: 'order-1' })
  })

  it('logs an error when ttq is missing', () => {
    const tiktok = new TikTok({ measurementId })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    tiktok.processAnalyticsEvent({ eventName: 'CompletePayment', eventParams: {} })

    expect(errorSpy).toHaveBeenCalledWith('[TIKTOK] ttq is not defined')
  })

  it('loads its pixel into a ttq the page already has, without re-running the snippet', () => {
    const { load, instance, pixel } = mockTtq()
    const pageTtq = window.ttq

    new TikTok({ measurementId })

    expect(document.querySelector(`script[data-id="tiktok-pixel-${measurementId}"]`)).toBeNull()
    expect(window.ttq).toBe(pageTtq)
    expect(load).toHaveBeenCalledWith(measurementId)
    expect(instance).toHaveBeenCalledWith(measurementId)
    expect(pixel.page).toHaveBeenCalled()
  })
})
