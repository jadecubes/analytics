import { type BaseAnalyticsEvent } from '../types/events'
export const PENDING_EVENTS_KEY_PREFIX = '@jadecubes/analytics:pending:'
export enum AnalyticsPlatforms {
  GA = 'GA',
  META = 'META',
  TIKTOK = 'TIKTOK',
}

/**
 * Each platform's snippet defines a stub (`gtag`, `fbq`, `ttq`) that queues calls until the
 * real script loads, so events can be handed over as soon as the snippet has run.
 */
const isStoredEvent = (item: unknown): boolean =>
  typeof item === 'object' && item !== null && typeof (item as { eventName?: unknown }).eventName === 'string'

export abstract class Analytics<T extends BaseAnalyticsEvent> {
  // Set here, not by subclass fields: those are assigned only after this constructor returns
  constructor(
    protected readonly platform: AnalyticsPlatforms,
    public readonly measurementId: string,
  ) {
    this.initialize()
    this.replayPendingEvents()
  }

  protected abstract initialize(): void
  protected abstract sendAnalyticsEvent(customEvent: T): void

  public processAnalyticsEvent(customEvent: T): void {
    try {
      this.sendAnalyticsEvent(customEvent)
    }
    catch (error) {
      console.error(`[${this.platform}] sendEvent`, error)
    }
  }

  /**
   * Saves the event and sends it on the next page load instead of now. Use it for events
   * fired right before a full-page navigation, which the unload would otherwise lose.
   * Falls back to sending now when sessionStorage is unavailable.
   */
  public sendAnalyticsPendingEvent(customEvent: T): void {
    try {
      const pendingEvents = this.readPendingEvents()
      window.sessionStorage.setItem(this.pendingStorageKey, JSON.stringify([...pendingEvents, customEvent]))
    }
    catch {
      this.processAnalyticsEvent(customEvent)
    }
  }

  protected replayPendingEvents(): void {
    let pendingEvents: T[]
    try {
      pendingEvents = this.readPendingEvents()
      // Cleared before sending, so an interrupted replay can't send an event twice
      window.sessionStorage.removeItem(this.pendingStorageKey)
    }
    catch {
      return
    }
    pendingEvents.forEach(event => this.processAnalyticsEvent(event))
  }

  private get pendingStorageKey(): string {
    return `${PENDING_EVENTS_KEY_PREFIX}${this.platform}`
  }

  private readPendingEvents(): T[] {
    const saved = window.sessionStorage.getItem(this.pendingStorageKey)
    try {
      const parsed: unknown = JSON.parse(saved ?? '[]')
      return Array.isArray(parsed) ? parsed.filter(isStoredEvent) as T[] : []
    }
    catch {
      return []
    }
  }
}
