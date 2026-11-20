import { type BaseAnalyticsEvent } from '../types/events'
import { Analytics, AnalyticsPlatforms } from './Analytics'

const STANDARD_EVENTS = new Set([
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact',
  'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout', 'Lead', 'PageView',
  'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication', 'Subscribe', 'ViewContent',
])

export interface MetaPixelConfig {
  measurementId: string
}

export class Meta extends Analytics {
  constructor(config: MetaPixelConfig) {
    super(AnalyticsPlatforms.META, config.measurementId)
  }

  protected initialize(): void {
    const snippetId = `meta-pixel-${this.measurementId}`
    if (document.querySelector(`script[data-id="${snippetId}"]`)) return
    const script = document.createElement('script')
    script.setAttribute('data-id', snippetId)
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    `
    document.head.appendChild(script)
    window.fbq?.('init', this.measurementId)
    window.fbq?.('trackSingle', this.measurementId, 'PageView')
  }

  protected sendAnalyticsEvent({ eventName, eventParams, eventId }: BaseAnalyticsEvent): void {
    if (!window.fbq) {
      console.error(`[${this.platform}] fbq is not defined`)
      return
    }
    const command = STANDARD_EVENTS.has(eventName) ? 'trackSingle' : 'trackSingleCustom'
    if (eventId) {
      window.fbq(command, this.measurementId, eventName, eventParams, { eventID: eventId })
    }
    else {
      window.fbq(command, this.measurementId, eventName, eventParams)
    }
  }
}
