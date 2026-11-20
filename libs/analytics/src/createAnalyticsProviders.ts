import { AnalyticsPlatforms } from './core/Analytics'
import { Ga, GA4Config } from './core/Ga'
import { Meta, MetaPixelConfig } from './core/Meta'
import { TikTokPixelConfig, TikTok } from './core/Tiktok'

export type AnalyticsConfig = Partial<{
  [AnalyticsPlatforms.GA]: GA4Config
  [AnalyticsPlatforms.META]: MetaPixelConfig
  [AnalyticsPlatforms.TIKTOK]: TikTokPixelConfig
}>

const analyticsInstances: Partial<{
  [AnalyticsPlatforms.GA]: Ga
  [AnalyticsPlatforms.META]: Meta
  [AnalyticsPlatforms.TIKTOK]: TikTok
}> = {}

const warnIfReconfigured = (platform: AnalyticsPlatforms, existing: { measurementId: string } | undefined, measurementId: string) => {
  if (existing && existing.measurementId !== measurementId) {
    console.warn(`[${platform}] already initialized with ${existing.measurementId}; ignoring ${measurementId}`)
  }
}

export const createAnalyticsProviders = (config: AnalyticsConfig) => {
  // Server-side rendering has no window; the call on the client sets everything up
  if (typeof window === 'undefined') return

  const gaConfig = config[AnalyticsPlatforms.GA]
  if (gaConfig) {
    warnIfReconfigured(AnalyticsPlatforms.GA, analyticsInstances[AnalyticsPlatforms.GA], gaConfig.measurementId)
    analyticsInstances[AnalyticsPlatforms.GA] ??= new Ga(gaConfig)
  }
  const metaConfig = config[AnalyticsPlatforms.META]
  if (metaConfig) {
    warnIfReconfigured(AnalyticsPlatforms.META, analyticsInstances[AnalyticsPlatforms.META], metaConfig.measurementId)
    analyticsInstances[AnalyticsPlatforms.META] ??= new Meta(metaConfig)
  }
  const tiktokConfig = config[AnalyticsPlatforms.TIKTOK]
  if (tiktokConfig) {
    warnIfReconfigured(AnalyticsPlatforms.TIKTOK, analyticsInstances[AnalyticsPlatforms.TIKTOK], tiktokConfig.measurementId)
    analyticsInstances[AnalyticsPlatforms.TIKTOK] ??= new TikTok(tiktokConfig)
  }
}

export const getAnalyticsInstance = (platform: AnalyticsPlatforms) => analyticsInstances[platform]
