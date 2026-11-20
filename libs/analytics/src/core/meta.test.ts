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

    it('should be ready as soon as the snippet is injected, without a load event', () => {
      // Act: Create instance. Inline scripts never fire `load`, so nothing triggers it here.
      const meta = Meta.getInstance(config)

      // Assert: the snippet's fbq queues calls until fbevents.js loads, so Meta is ready at once
      expect(meta.isReady).toBe(true)
    })

    it('should set isReady to true if script already exists in DOM', () => {
      // Arrange: Pre-inject the script
      const existingScript = document.createElement('script')
      existingScript.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(existingScript)

      // Act: Create Meta instance
      const meta = Meta.getInstance(config)

      // Assert: Should recognize existing script and be ready
      expect(meta.isReady).toBe(true)
    })
  })

  describe('test_processAnalyticsEvent_validEvent_sendsEventWhenReady', () => {
    it('should queue and send event when fbq is available and ready', () => {
      // Arrange: Setup Meta instance and mock fbq
      const meta = Meta.getInstance(config)
      const mockFbq = vi.fn()
      window.fbq = mockFbq
      meta['setIsReady'](true)

      const event: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { currency: 'USD', value: 100 },
      }

      // Act: Process the event
      meta.processAnalyticsEvent(event)
      vi.advanceTimersByTime(1500)

      // Assert: fbq should be called with correct parameters
      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        currency: 'USD',
        value: 100,
      })
      expect(mockFbq).toHaveBeenCalledTimes(1)
    })

    it('should queue event and retry sending when not initially ready', () => {
      // Arrange: Setup Meta instance without being ready
      const meta = Meta.getInstance(config)
      meta['setIsReady'](false)
      const mockFbq = vi.fn()
      window.fbq = mockFbq

      const event: BaseAnalyticsEvent = {
        eventName: 'AddToCart',
        eventParams: { content_name: 'Product A' },
      }

      // Act: Process event before ready, then set ready and advance timers
      meta.processAnalyticsEvent(event)
      meta['setIsReady'](true)
      vi.advanceTimersByTime(1500)

      // Assert: Event should be sent after retry
      expect(mockFbq).toHaveBeenCalledWith('track', 'AddToCart', {
        content_name: 'Product A',
      })
    })
  })

  describe('test_processAnalyticsEvent_multipleEvents_processesAllInQueue', () => {
    it('should process multiple queued events when platform becomes ready', () => {
      // Arrange: Setup Meta instance and multiple events
      const meta = Meta.getInstance(config)
      meta['setIsReady'](false)
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
      meta['setIsReady'](true)
      vi.advanceTimersByTime(1500)

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
      meta['setIsReady'](true)

      const event: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { value: 100 },
      }

      // Act & Assert: Should not throw
      expect(() => {
        meta.processAnalyticsEvent(event)
        vi.advanceTimersByTime(1500)
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
      meta['setIsReady'](true)

      const event: BaseAnalyticsEvent = {
        eventName: 'PageView',
        eventParams: {},
      }

      // Act: Process event with empty params
      meta.processAnalyticsEvent(event)
      vi.advanceTimersByTime(1500)

      // Assert: Should send with empty object
      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', {})
    })
  })

  describe('test_getInstance_withUserId_initializesWithUserId', () => {
    it('should accept configuration with userId', () => {
      // Arrange: Config with userId
      const configWithUserId = { measurementId: 'TEST-ID', userId: 'user123' }

      // Act: Create instance with userId
      const meta = Meta.getInstance(configWithUserId)

      // Assert: Instance should be created successfully
      expect(meta).toBeInstanceOf(Meta)
    })
  })

  describe('test_eventQueue_getter_returnsImmutableCopy', () => {
    it('should return a copy of event queue without exposing internal state', () => {
      // Arrange: Setup Meta instance and add event
      const meta = Meta.getInstance(config)
      const event: BaseAnalyticsEvent = {
        eventName: 'Test',
        eventParams: {},
      }

      // Act: Get event queue before and after adding event
      const queueBefore = meta.eventQueue
      meta['addToEventQueue'](event)
      const queueAfter = meta.eventQueue

      // Assert: Queue should be a copy (different reference)
      expect(queueBefore).not.toBe(queueAfter)
      expect(queueBefore.length).toBe(0)
      expect(queueAfter.length).toBe(1)
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

  describe('test_processAnalyticsEvent_notReady_schedulesOneRetry', () => {
    it('should keep a single retry timer however many events are queued', () => {
      const meta = Meta.getInstance(config)
      meta['setIsReady'](false)

      meta.processAnalyticsEvent({ eventName: 'ViewContent', eventParams: {} })
      meta.processAnalyticsEvent({ eventName: 'AddToCart', eventParams: {} })
      meta.processAnalyticsEvent({ eventName: 'Purchase', eventParams: {} })

      expect(vi.getTimerCount()).toBe(1)
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
