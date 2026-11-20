import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PENDING_EVENTS_KEY_PREFIX } from './Analytics'
import { Ga } from './Ga'
import { Meta } from './Meta'

const metaId = 'META-TEST'
const gaId = 'G-TEST'
const metaKey = `${PENDING_EVENTS_KEY_PREFIX}META`

const simulateNextPageLoad = () => {
  document.head.innerHTML = ''
  window.fbq = undefined
  window.gtag = undefined
}

describe('sendAnalyticsPendingEvent', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    simulateNextPageLoad()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('saves the event instead of sending it', () => {
    const meta = new Meta({ measurementId: metaId })
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    meta.sendAnalyticsPendingEvent({ eventName: 'AddToCart', eventParams: { value: 10 }, eventId: 'cart-1' })

    expect(mockFbq).not.toHaveBeenCalled()
    expect(JSON.parse(window.sessionStorage.getItem(metaKey) ?? '[]')).toEqual([
      { eventName: 'AddToCart', eventParams: { value: 10 }, eventId: 'cart-1' },
    ])
  })

  it('sends saved events in order on the next page, after init and PageView, then clears them', () => {
    const meta = new Meta({ measurementId: metaId })
    meta.sendAnalyticsPendingEvent({ eventName: 'AddToCart', eventParams: {} })
    meta.sendAnalyticsPendingEvent({ eventName: 'InitiateCheckout', eventParams: {} })

    simulateNextPageLoad()
    const mockFbq = vi.fn()
    window.fbq = mockFbq
    new Meta({ measurementId: metaId })

    expect(mockFbq.mock.calls).toEqual([
      ['init', metaId],
      ['trackSingle', metaId, 'PageView'],
      ['trackSingle', metaId, 'AddToCart', {}],
      ['trackSingle', metaId, 'InitiateCheckout', {}],
    ])
    expect(window.sessionStorage.getItem(metaKey)).toBeNull()
  })

  it('replays GA events through gtag', () => {
    new Ga({ measurementId: gaId }).sendAnalyticsPendingEvent({ eventName: 'purchase', eventParams: { value: 3 } })

    simulateNextPageLoad()
    const mockGtag = vi.fn()
    window.gtag = mockGtag
    new Ga({ measurementId: gaId })

    expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', { value: 3, send_to: gaId })
  })

  it('replays each platform\'s events only on that platform', () => {
    new Meta({ measurementId: metaId }).sendAnalyticsPendingEvent({ eventName: 'Purchase', eventParams: {} })

    simulateNextPageLoad()
    const mockGtag = vi.fn()
    window.gtag = mockGtag
    new Ga({ measurementId: gaId })

    expect(mockGtag).not.toHaveBeenCalledWith('event', 'Purchase', expect.anything())
    expect(window.sessionStorage.getItem(metaKey)).not.toBeNull()
  })

  it('sends the event now when sessionStorage is unavailable', () => {
    const meta = new Meta({ measurementId: metaId })
    const mockFbq = vi.fn()
    window.fbq = mockFbq
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })

    meta.sendAnalyticsPendingEvent({ eventName: 'Purchase', eventParams: { value: 5 } })

    expect(mockFbq).toHaveBeenCalledWith('trackSingle', metaId, 'Purchase', { value: 5 })
  })

  it('discards a corrupt saved queue without throwing', () => {
    window.sessionStorage.setItem(metaKey, '{not json')
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    expect(() => new Meta({ measurementId: metaId })).not.toThrow()
    expect(mockFbq.mock.calls).toEqual([['init', metaId], ['trackSingle', metaId, 'PageView']])
    expect(window.sessionStorage.getItem(metaKey)).toBeNull()
  })

  it('replays only the saved items that are events', () => {
    window.sessionStorage.setItem(metaKey, JSON.stringify([null, 'x', { eventName: 'Purchase', eventParams: {} }]))
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    expect(() => new Meta({ measurementId: metaId })).not.toThrow()
    expect(mockFbq).toHaveBeenLastCalledWith('trackSingle', metaId, 'Purchase', {})
    expect(mockFbq).toHaveBeenCalledTimes(3)
  })

  it('sets the platform up even when sessionStorage is blocked', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    expect(() => new Meta({ measurementId: metaId })).not.toThrow()
    expect(mockFbq).toHaveBeenCalledWith('init', metaId)
  })
})
