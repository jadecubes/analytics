import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PENDING_EVENTS_KEY_PREFIX } from './Analytics'
import { Ga } from './Ga'
import { Meta } from './Meta'

const metaConfig = { measurementId: 'META-TEST-ID' }
const gaConfig = { measurementId: 'G-TEST' }
const metaKey = `${PENDING_EVENTS_KEY_PREFIX}META`

// A new page load: fresh singletons, fresh DOM, sessionStorage kept
const simulateNextPageLoad = () => {
  // @ts-expect-error reset singleton for testing
  Meta.instance = null
  // @ts-expect-error reset singleton for testing
  Ga.instance = null
  document.head.innerHTML = ''
}

describe('sendAnalyticsPendingEvent', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.fbq = undefined
    window.gtag = undefined
    simulateNextPageLoad()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_sendAnalyticsPendingEvent_savesInsteadOfSending', () => {
    const meta = Meta.getInstance(metaConfig)
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    meta.sendAnalyticsPendingEvent({ eventName: 'AddToCart', eventParams: { value: 10 }, eventId: 'cart-1' })

    expect(mockFbq).not.toHaveBeenCalled()
    expect(JSON.parse(window.sessionStorage.getItem(metaKey) ?? '[]')).toEqual([
      { eventName: 'AddToCart', eventParams: { value: 10 }, eventId: 'cart-1' },
    ])
  })

  it('test_nextPageLoad_sendsPendingEventsInOrderAndClearsThem', () => {
    const meta = Meta.getInstance(metaConfig)
    meta.sendAnalyticsPendingEvent({ eventName: 'AddToCart', eventParams: {} })
    meta.sendAnalyticsPendingEvent({ eventName: 'InitiateCheckout', eventParams: {} })

    simulateNextPageLoad()
    const mockFbq = vi.fn()
    window.fbq = mockFbq
    Meta.getInstance(metaConfig)

    expect(mockFbq).toHaveBeenNthCalledWith(1, 'track', 'AddToCart', {})
    expect(mockFbq).toHaveBeenNthCalledWith(2, 'track', 'InitiateCheckout', {})
    expect(window.sessionStorage.getItem(metaKey)).toBeNull()
  })

  it('test_nextPageLoad_eachPlatformReplaysOnlyItsOwnEvents', () => {
    Meta.getInstance(metaConfig).sendAnalyticsPendingEvent({ eventName: 'Purchase', eventParams: {} })

    simulateNextPageLoad()
    const mockGtag = vi.fn()
    window.gtag = mockGtag
    Ga.getInstance(gaConfig)

    expect(mockGtag).not.toHaveBeenCalledWith('event', 'Purchase', expect.anything())
    expect(window.sessionStorage.getItem(metaKey)).not.toBeNull()
  })

  it('test_sessionStorageUnavailable_sendsImmediately', () => {
    const meta = Meta.getInstance(metaConfig)
    const mockFbq = vi.fn()
    window.fbq = mockFbq
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })

    meta.sendAnalyticsPendingEvent({ eventName: 'Purchase', eventParams: { value: 5 } })

    expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', { value: 5 })
  })

  it('test_corruptStoredQueue_isDiscardedWithoutThrowing', () => {
    window.sessionStorage.setItem(metaKey, '{not json')
    const mockFbq = vi.fn()
    window.fbq = mockFbq

    expect(() => Meta.getInstance(metaConfig)).not.toThrow()
    expect(mockFbq).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(metaKey)).toBeNull()
  })
})
