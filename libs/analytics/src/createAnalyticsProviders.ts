import { type Analytics, AnalyticsPlatforms } from './core/Analytics'
import { Ga, type GA4Config } from './core/Ga'
import { Meta, type MetaPixelConfig } from './core/Meta'
import { TikTok, type TikTokPixelConfig } from './core/Tiktok'

export type AnalyticsConfig = Partial<{
  [AnalyticsPlatforms.GA]: GA4Config
  [AnalyticsPlatforms.META]: MetaPixelConfig
  [AnalyticsPlatforms.TIKTOK]: TikTokPixelConfig
}>

const platformClasses: Record<AnalyticsPlatforms, new (config: { measurementId: string }) => Analytics> = {
  [AnalyticsPlatforms.GA]: Ga,
  [AnalyticsPlatforms.META]: Meta,
  [AnalyticsPlatforms.TIKTOK]: TikTok,
}

const analyticsInstances: Partial<Record<AnalyticsPlatforms, Analytics>> = {}

export const createAnalyticsProviders = (config: AnalyticsConfig) => {
  if (typeof window === 'undefined') return

  for (const platform of Object.values(AnalyticsPlatforms)) {
    const platformConfig = config[platform]
    if (!platformConfig?.measurementId) continue
    const existing = analyticsInstances[platform]
    if (existing && existing.measurementId !== platformConfig.measurementId) {
      console.warn(`[${platform}] already initialized with ${existing.measurementId}; ignoring ${platformConfig.measurementId}`)
    }
    analyticsInstances[platform] ??= new platformClasses[platform](platformConfig)
  }
}

export const getAnalyticsInstance = (platform: AnalyticsPlatforms) => analyticsInstances[platform]
