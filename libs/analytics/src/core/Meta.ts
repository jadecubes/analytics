import { type BaseAnalyticsEvent } from '../types/events.ts'
import { Analytics, AnalyticsPlatforms } from './Analytics.ts'

// https://developers.facebook.com/docs/meta-pixel/reference#standard-events
const STANDARD_EVENTS = new Set([
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact',
  'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout', 'Lead', 'PageView',
  'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication', 'Subscribe', 'ViewContent',
])

export interface MetaPixelConfig {
  measurementId: string
}

export class Meta extends Analytics<BaseAnalyticsEvent> {
  protected measurementId: string
  private static instance: Meta | null = null
  protected readonly platform = AnalyticsPlatforms.META

  constructor(config: MetaPixelConfig) {
    super()
    this.measurementId = config.measurementId
    this.initialize()
    this.replayPendingEvents()
  }

  // Static getInstance method for singleton pattern
  public static getInstance(config: MetaPixelConfig): Meta {
    if (!Meta.instance) {
      Meta.instance = new Meta(config)
    }
    else if (config.measurementId !== Meta.instance.measurementId) {
      console.warn(`[META] already initialized with ${Meta.instance.measurementId}; ignoring ${config.measurementId}`)
    }
    return Meta.instance
  }

  protected initialize(): void {
    const head = document.querySelector('head')
    const existingScript = document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')
    // https://www.facebook.com/help/1604282442927573
    if (!existingScript) {
      const script = document.createElement('script')
      script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${this.measurementId}');
      fbq('track', 'PageView');
      `
      head?.appendChild(script)
    }
  }

  protected sendAnalyticsEvent(customEvent: BaseAnalyticsEvent): void {
    const { eventName, eventParams, eventId } = customEvent
    const command = STANDARD_EVENTS.has(eventName) ? 'track' : 'trackCustom'
    const fbqEvent = eventId
      ? [command, eventName, eventParams, { eventID: eventId }]
      : [command, eventName, eventParams]
    if (window.fbq) {
      try {
        window.fbq(...fbqEvent)
      }
      catch (error) {
        console.error('[META] sendEvent', error)
      }
    }
    else {
      console.error('[META] fbq is not defined')
    }
  }
}
