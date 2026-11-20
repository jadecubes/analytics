import { beforeEach, describe, it, expect, vi } from 'vitest'
import { type BaseAnalyticsEvent } from '../types/events'
import { TikTok } from './Tiktok'

describe('TikTok Analytics', () => {
  const measurementId = 'TT-TEST-ID'
  const config = { measurementId }

  beforeEach(() => {
    // Arrange: clean state
    window.ttq = undefined
    document.head.innerHTML = ''
    // @ts-expect-error: override singleton for test
    TikTok.instance = null
  })

  describe('test_getInstance_multipleCallsSameConfig_returnsSameSingletonInstance', () => {
    it('should return the same singleton instance when called multiple times', () => {
      // Arrange: Config is already set up in beforeEach

      // Act: Get two instances
      const firstInstance = TikTok.getInstance(config)
      const secondInstance = TikTok.getInstance(config)

      // Assert: Both should be the same instance
      expect(firstInstance).toBe(secondInstance)
    })
  })

  describe('test_initialize_validConfig_injectsTikTokScriptIntoDOM', () => {
    it('should inject TikTok pixel script with correct data-id attribute', () => {
      // Arrange: Clean state ensured by beforeEach

      // Act: Create TikTok instance
      TikTok.getInstance(config)

      // Assert: Script should be injected with correct data-id
      const script = document.querySelector(`script[data-id="tiktok-pixel-${measurementId}"]`)
      expect(script).not.toBeNull()
      expect(script?.textContent).toContain(measurementId)
      expect(script?.textContent).toContain('analytics.tiktok.com')
    })
  })

  describe('test_processAnalyticsEvent_validEvent_sendsEvent', () => {
    it('should send event when ttq is available and ready', () => {
      // Arrange: Setup TikTok instance and mock ttq
      const tiktok = TikTok.getInstance(config)
      const mockTtq = {
        track: vi.fn(),
        push: vi.fn(),
        page: vi.fn(),
        load: vi.fn(),
      }
      window.ttq = mockTtq

      const event: BaseAnalyticsEvent = {
        eventName: 'CompletePayment',
        eventParams: { value: 99.99, currency: 'USD' },
      }

      // Act: Process the event
      tiktok.processAnalyticsEvent(event)

      // Assert: ttq.track should be called with correct parameters
      expect(mockTtq.track).toHaveBeenCalledWith('CompletePayment', {
        value: 99.99,
        currency: 'USD',
      })
      expect(mockTtq.track).toHaveBeenCalledTimes(1)
    })
  })

  describe('test_processAnalyticsEvent_multipleEvents_sendsAllInOrder', () => {
    it('should send multiple events in order', () => {
      // Arrange: Setup TikTok instance and multiple events
      const tiktok = TikTok.getInstance(config)
      const mockTtq = {
        track: vi.fn(),
        push: vi.fn(),
        page: vi.fn(),
        load: vi.fn(),
      }
      window.ttq = mockTtq

      const event1: BaseAnalyticsEvent = {
        eventName: 'ViewContent',
        eventParams: { content_type: 'product' },
      }
      const event2: BaseAnalyticsEvent = {
        eventName: 'AddToCart',
        eventParams: { content_id: 'SKU123' },
      }
      const event3: BaseAnalyticsEvent = {
        eventName: 'InitiateCheckout',
        eventParams: { value: 150 },
      }

      // Act: Send multiple events
      tiktok.processAnalyticsEvent(event1)
      tiktok.processAnalyticsEvent(event2)
      tiktok.processAnalyticsEvent(event3)

      // Assert: All events should be sent
      expect(mockTtq.track).toHaveBeenCalledTimes(3)
      expect(mockTtq.track).toHaveBeenNthCalledWith(1, 'ViewContent', { content_type: 'product' })
      expect(mockTtq.track).toHaveBeenNthCalledWith(2, 'AddToCart', { content_id: 'SKU123' })
      expect(mockTtq.track).toHaveBeenNthCalledWith(3, 'InitiateCheckout', { value: 150 })
    })
  })

  describe('test_processAnalyticsEvent_ttqUndefined_handlesGracefully', () => {
    it('should not throw error when ttq is undefined', () => {
      // Arrange: Setup TikTok instance without ttq
      const tiktok = TikTok.getInstance(config)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const event: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { value: 100 },
      }

      // Act & Assert: Should not throw
      expect(() => {
        tiktok.processAnalyticsEvent(event)
      }).not.toThrow()

      // Assert: Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TT] ttq is not defined')

      // Cleanup
      consoleErrorSpy.mockRestore()
    })
  })

  describe('test_processAnalyticsEvent_ttqTrackUndefined_handlesGracefully', () => {
    it('should handle gracefully when ttq.track is undefined', () => {
      // Arrange: Setup TikTok instance with ttq but without track method
      const tiktok = TikTok.getInstance(config)
      const mockTtq = {
        push: vi.fn(),
        page: vi.fn(),
        load: vi.fn(),
      }
      // @ts-expect-error: Intentionally testing incomplete ttq object
      window.ttq = mockTtq

      const event: BaseAnalyticsEvent = {
        eventName: 'Purchase',
        eventParams: { value: 100 },
      }

      // Act & Assert: track is optional, so a missing one must not throw
      expect(() => tiktok.processAnalyticsEvent(event)).not.toThrow()
    })
  })

  describe('test_processAnalyticsEvent_emptyEventParams_sendsEventWithoutParams', () => {
    it('should send event with empty params object', () => {
      // Arrange: Setup TikTok instance
      const tiktok = TikTok.getInstance(config)
      const mockTtq = {
        track: vi.fn(),
        push: vi.fn(),
        page: vi.fn(),
        load: vi.fn(),
      }
      window.ttq = mockTtq

      const event: BaseAnalyticsEvent = {
        eventName: 'PageView',
        eventParams: {},
      }

      // Act: Process event with empty params
      tiktok.processAnalyticsEvent(event)

      // Assert: Should send with empty object
      expect(mockTtq.track).toHaveBeenCalledWith('PageView', {})
    })
  })

  describe('test_processAnalyticsEvent_specialCharactersInEventName_handlesCorrectly', () => {
    it('should handle event names with special characters', () => {
      // Arrange: Setup TikTok instance
      const tiktok = TikTok.getInstance(config)
      const mockTtq = {
        track: vi.fn(),
        push: vi.fn(),
        page: vi.fn(),
        load: vi.fn(),
      }
      window.ttq = mockTtq

      const event: BaseAnalyticsEvent = {
        eventName: 'Custom_Event-2024',
        eventParams: { test: 'value' },
      }

      // Act: Process event with special characters
      tiktok.processAnalyticsEvent(event)

      // Assert: Should send event as-is
      expect(mockTtq.track).toHaveBeenCalledWith('Custom_Event-2024', { test: 'value' })
    })
  })

  describe('test_initialize_differentMeasurementIds_createsUniqueScripts', () => {
    it('should use measurement ID in script data-id attribute', () => {
      // Arrange: Different measurement IDs
      const customId = 'CUSTOM-TT-ID-123'
      const customConfig = { measurementId: customId }

      // @ts-expect-error: reset singleton
      TikTok.instance = null

      // Act: Create instance with custom ID
      TikTok.getInstance(customConfig)

      // Assert: Script should have custom ID in data-id
      const script = document.querySelector(`script[data-id="tiktok-pixel-${customId}"]`)
      expect(script).not.toBeNull()
      expect(script?.textContent).toContain(customId)
    })
  })

  describe('test_processAnalyticsEvent_eventId_passedAsEventIdOption', () => {
    it('should pass eventId to TikTok as event_id for deduplication', () => {
      const tiktok = TikTok.getInstance(config)
      const mockTtq = { track: vi.fn(), push: vi.fn(), page: vi.fn(), load: vi.fn() }
      window.ttq = mockTtq

      tiktok.processAnalyticsEvent({ eventName: 'CompletePayment', eventParams: { value: 10 }, eventId: 'order-1' })

      expect(mockTtq.track).toHaveBeenCalledWith('CompletePayment', { value: 10 }, { event_id: 'order-1' })
    })
  })
})
