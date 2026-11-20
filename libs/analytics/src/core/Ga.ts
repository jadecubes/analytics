import { type BaseAnalyticsEvent } from '../types/events'
import { Analytics, AnalyticsPlatforms } from './Analytics'
export interface GA4Config {
  measurementId: string
}
export class Ga extends Analytics<BaseAnalyticsEvent> {
  constructor(config: GA4Config) {
    super(AnalyticsPlatforms.GA, config.measurementId)
  }

  protected initialize() {
    const head = document.querySelector('head')
    const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`
    // dataLayer needs to be initialized before GA script is loaded
    window.dataLayer = window.dataLayer || []
    // https://developers.google.com/tag-platform/devguides/datalayer
    // gtag.js only reads the `arguments` object, not an array of the same values
    function gtag() {
      window.dataLayer?.push(arguments)
    }

    if (!window.gtag) {
      window.gtag = gtag
      window.gtag('js', new Date())
    }

    // The page may already run gtag for another property, so configure ours unless its script is present
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      window.gtag('config', this.measurementId)
      const script = document.createElement('script')
      script.setAttribute('src', scriptSrc)
      script.async = true
      head?.appendChild(script)
    }
  }

  protected sendAnalyticsEvent({ eventName, eventParams }: BaseAnalyticsEvent): void {
    if (!window.gtag) {
      console.error('[GA] gtag is not defined')
      return
    }
    window.gtag('event', eventName, eventParams)
  }
}
