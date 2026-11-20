import { type BaseAnalyticsEvent } from '../types/events.ts'
import { Analytics, AnalyticsPlatforms } from './Analytics.ts'
export interface GA4Config {
  measurementId: string
}
export class Ga extends Analytics<BaseAnalyticsEvent> {
  protected measurementId: string
  private static instance: Ga | null = null
  protected readonly platform = AnalyticsPlatforms.GA

  constructor(config: GA4Config) {
    super()
    this.measurementId = config.measurementId
    this.initialize()
    this.replayPendingEvents()
  }

  // Static getInstance method for singleton pattern
  public static getInstance(config: GA4Config): Ga {
    if (!Ga.instance) {
      Ga.instance = new Ga(config)
    }
    else if (config.measurementId !== Ga.instance.measurementId) {
      console.warn(`[GA] already initialized with ${Ga.instance.measurementId}; ignoring ${config.measurementId}`)
    }
    return Ga.instance
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

  protected sendAnalyticsEvent(customEvent: BaseAnalyticsEvent): void {
    const { eventName, eventParams } = customEvent

    const gtagEvent = ['event', eventName, eventParams]

    if (window.gtag) {
      try {
        window.gtag(...gtagEvent)
      }
      catch (error) {
        console.error('[GA] sendEvent', error)
      }
    }
    else {
      console.error('[GA] gtag is not defined')
    }
  }
}
