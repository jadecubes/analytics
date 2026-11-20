import { type BaseAnalyticsEvent } from '../types/events'
import { Analytics, AnalyticsPlatforms } from './Analytics'

export interface GA4Config {
  measurementId: string
}

export class Ga extends Analytics {
  constructor(config: GA4Config) {
    super(AnalyticsPlatforms.GA, config.measurementId)
  }

  protected initialize(): void {
    const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`
    window.dataLayer = window.dataLayer || []
    if (!window.gtag) {
      // gtag.js only reads `arguments` objects from dataLayer, not arrays
      window.gtag = function gtag() {
        window.dataLayer?.push(arguments)
      }
      window.gtag('js', new Date())
    }
    // The page may already run gtag for another property; set ours up unless its script is there
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      window.gtag('config', this.measurementId)
      const script = document.createElement('script')
      script.src = scriptSrc
      script.async = true
      document.head.appendChild(script)
    }
  }

  protected sendAnalyticsEvent({ eventName, eventParams }: BaseAnalyticsEvent): void {
    if (!window.gtag) {
      console.error(`[${this.platform}] gtag is not defined`)
      return
    }
    window.gtag('event', eventName, { ...eventParams, send_to: this.measurementId })
  }
}
