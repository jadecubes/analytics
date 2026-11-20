import { type BaseAnalyticsEvent } from '../types/events'
import { Analytics, AnalyticsPlatforms } from './Analytics'

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
  constructor(config: MetaPixelConfig) {
    super(AnalyticsPlatforms.META, config.measurementId)
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

  protected sendAnalyticsEvent({ eventName, eventParams, eventId }: BaseAnalyticsEvent): void {
    if (!window.fbq) {
      console.error('[META] fbq is not defined')
      return
    }
    const command = STANDARD_EVENTS.has(eventName) ? 'track' : 'trackCustom'
    if (eventId) {
      window.fbq(command, eventName, eventParams, { eventID: eventId })
    }
    else {
      window.fbq(command, eventName, eventParams)
    }
  }
}
