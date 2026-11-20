import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { type BaseAnalyticsEvent } from '../types/events'
import { Meta } from './Meta'

describe('Meta Analytics', () => {
  const measurementId = 'META-TEST-ID'
  const config = { measurementId, userId: null }

  beforeEach(() => {
    // Arrange: Setup fake timers and clean DOM
    vi.useFakeTimers()
    window.fbq = undefined
    document.head.innerHTML = ''
    // @ts-expect-error override singleton for testing
    Meta.instance = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('test_getInstance_multipleCallsSameConfig_returnsSameSingletonInstance', () => {
    it('should return the same singleton instance when called multiple times', () => {
      // Arrange: Config is already set up in beforeEach

      // Act: Get two instances
      const firstInstance = Meta.getInstance(config)
      const secondInstance = Meta.getInstance(config)

      // Assert: Both should be the same instance
      expect(firstInstance).toBe(secondInstance)
    })
  })

  describe('test_initialize_validConfig_injectsFbqScriptIntoDOM', () => {
    it('should inject Meta Pixel inline script into document head on initialization', () => {
      // Arrange: Clean state ensured by beforeEach

      // Act: Create Meta instance
      Meta.getInstance(config)

      // Assert: Script should be injected in DOM
      const scripts = document.querySelectorAll('script')
      const fbqScript = Array.from(scripts).find(s =>
        s.textContent?.includes('connect.facebook.net/en_US/fbevents.js'),
      )
      expect(fbqScript).not.toBeNull()
      expect(fbqScript?.textContent).toContain(measurementId)
    })
  })

  describe('test_processAnalyticsEvent_validEvent_sendsEvent', () => {
    it('should send event when fbq is available and ready', () => {
      // Arrange: Setup Meta instance and mock fbq
      const meta = Meta.getInstance(config)
      const mockFbq = vi.fn()
      window.fbq = mockFbq

      const event: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { currency: 'USD', value: 100 },
      }

      // Act: Process the event
      meta.processAnalyticsEvent(event)

      // Assert: fbq should be called with correct parameters
      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        currency: 'USD',
        value: 100,
      })
      expect(mockFbq).toHaveBeenCalledTimes(1)
    })
  })

  describe('test_processAnalyticsEvent_multipleEvents_sendsAllInOrder', () => {
    it('should send multiple events in order', () => {
      // Arrange: Setup Meta instance and multiple events
      const meta = Meta.getInstance(config)
      const mockFbq = vi.fn()
      window.fbq = mockFbq

      const event1: BaseAnalyticsEvent = {
        eventName: 'ViewContent',
        eventParams: { content_type: 'product' },
      }
      const event2: BaseAnalyticsEvent = {
        eventName: 'AddToCart',
        eventParams: { content_name: 'Item' },
      }
      const event3: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { value: 50 },
      }

      // Act: Queue multiple events before ready
      meta.processAnalyticsEvent(event1)
      meta.processAnalyticsEvent(event2)
      meta.processAnalyticsEvent(event3)

      // Set ready and advance time

      // Assert: All events should be sent
      expect(mockFbq).toHaveBeenCalledTimes(3)
      expect(mockFbq).toHaveBeenNthCalledWith(1, 'track', 'ViewContent', { content_type: 'product' })
      expect(mockFbq).toHaveBeenNthCalledWith(2, 'track', 'AddToCart', { content_name: 'Item' })
      expect(mockFbq).toHaveBeenNthCalledWith(3, 'track', 'Purchase', { value: 50 })
    })
  })

  describe('test_processAnalyticsEvent_fbqUndefined_handlesGracefully', () => {
    it('should not throw error when fbq is undefined', () => {
      // Arrange: Setup Meta instance without fbq
      const meta = Meta.getInstance(config)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const event: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { value: 100 },
      }

      // Act & Assert: Should not throw
      expect(() => {
        meta.processAnalyticsEvent(event)
      }).not.toThrow()

      // Cleanup
      consoleErrorSpy.mockRestore()
    })
  })

  describe('test_processAnalyticsEvent_emptyEventParams_sendsEventWithoutParams', () => {
    it('should send event with empty params object', () => {
      // Arrange: Setup Meta instance
      const meta = Meta.getInstance(config)
      const mockFbq = vi.fn()
      window.fbq = mockFbq

      const event: BaseAnalyticsEvent = {
        eventName: 'PageView',
        eventParams: {},
      }

      // Act: Process event with empty params
      meta.processAnalyticsEvent(event)

      // Assert: Should send with empty object
      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', {})
    })
  })

  describe('test_processAnalyticsEvent_customEventAndEventId', () => {
    it('should send a non-standard event name with trackCustom', () => {
      const meta = Meta.getInstance(config)
      const mockFbq = vi.fn()
      window.fbq = mockFbq

      meta.processAnalyticsEvent({ eventName: 'ShareCampaign', eventParams: { method: 'line' } })

      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'ShareCampaign', { method: 'line' })
    })

    it('should pass eventId to Meta as eventID for deduplication', () => {
      const meta = Meta.getInstance(config)
      const mockFbq = vi.fn()
      window.fbq = mockFbq

      meta.processAnalyticsEvent({ eventName: 'Purchase', eventParams: { value: 10 }, eventId: 'order-1' })

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', { value: 10 }, { eventID: 'order-1' })
    })
  })

  describe('test_getInstance_differentMeasurementId_warns', () => {
    it('should keep the first instance and warn when called with another id', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const first = Meta.getInstance(config)

      const second = Meta.getInstance({ measurementId: 'OTHER-ID' })

      expect(second).toBe(first)
      expect(warnSpy).toHaveBeenCalledOnce()
      warnSpy.mockRestore()
    })
  })
})
