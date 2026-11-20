interface Window {
  dataLayer: unknown[] | undefined
  gtag: ((...args: unknown[]) => void) | undefined
  fbq: ((...args: unknown[]) => void) | undefined
  ttq: {
    track: ((event: string, payload?: unknown, options?: { event_id: string }) => void) | undefined
    push: ((args: unknown[]) => void) | undefined
    page: (() => void) | undefined
    load: ((measurementId: string) => void) | undefined
  } | undefined
}
