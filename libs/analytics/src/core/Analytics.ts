import { type BaseAnalyticsEvent } from '../types/events'

export const PENDING_EVENTS_KEY_PREFIX = '@jadecubes/analytics:pending:'

export enum AnalyticsPlatforms {
  GA = 'GA',
  META = 'META',
  TIKTOK = 'TIKTOK',
}

const isStoredEvent = (item: unknown): item is BaseAnalyticsEvent =>
  typeof item === 'object' && item !== null && typeof (item as { eventName?: unknown }).eventName === 'string'

export abstract class Analytics {
  constructor(
    protected readonly platform: AnalyticsPlatforms,
    public readonly measurementId: string,
  ) {
    this.initialize()
    this.replayPendingEvents()
  }

  protected abstract initialize(): void
  protected abstract sendAnalyticsEvent(customEvent: BaseAnalyticsEvent): void

  public processAnalyticsEvent(customEvent: BaseAnalyticsEvent): void {
    try {
      this.sendAnalyticsEvent(customEvent)
    }
    catch (error) {
      console.error(`[${this.platform}] sendEvent`, error)
    }
  }

  /** Sends the event on the next page instead of now, so a full-page navigation can't lose it. */
  public sendAnalyticsPendingEvent(customEvent: BaseAnalyticsEvent): void {
    try {
      window.sessionStorage.setItem(this.pendingStorageKey, JSON.stringify([...this.readPendingEvents(), customEvent]))
    }
    catch {
      this.processAnalyticsEvent(customEvent)
    }
  }

  private replayPendingEvents(): void {
    let pendingEvents: BaseAnalyticsEvent[]
    try {
      pendingEvents = this.readPendingEvents()
      window.sessionStorage.removeItem(this.pendingStorageKey)
    }
    catch {
      return
    }
    pendingEvents.forEach(event => this.processAnalyticsEvent(event))
  }

  private get pendingStorageKey(): string {
    return `${PENDING_EVENTS_KEY_PREFIX}${this.platform}:${this.measurementId}`
  }

  private readPendingEvents(): BaseAnalyticsEvent[] {
    const saved = window.sessionStorage.getItem(this.pendingStorageKey)
    try {
      const parsed: unknown = JSON.parse(saved ?? '[]')
      return Array.isArray(parsed) ? parsed.filter(isStoredEvent) : []
    }
    catch {
      return []
    }
  }
}
