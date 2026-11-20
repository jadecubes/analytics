interface TikTokPixel {
  track: (event: string, payload?: unknown, options?: { event_id: string }) => void
  page: () => void
}

interface Window {
  dataLayer: unknown[] | undefined
  gtag: ((...args: unknown[]) => void) | undefined
  fbq: ((...args: unknown[]) => void) | undefined
  ttq: { load: (pixelId: string) => void, instance: (pixelId: string) => TikTokPixel, _i?: Record<string, unknown> } | undefined
}
