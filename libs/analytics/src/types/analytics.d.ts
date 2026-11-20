interface TikTokPixel {
  track: (event: string, payload?: unknown, options?: { event_id: string }) => void
}

interface Window {
  dataLayer: unknown[] | undefined
  gtag: ((...args: unknown[]) => void) | undefined
  fbq: ((...args: unknown[]) => void) | undefined
  ttq: { instance: (pixelId: string) => TikTokPixel } | undefined
}
