import { type BaseAnalyticsEvent } from '../types/events'
export const TIME_WAIT_FOR_READY_PLATFORM = 500
export const PENDING_EVENTS_KEY_PREFIX = '@jadecubes/analytics:pending:'
export enum AnalyticsPlatforms {
  GA = 'GA',
  META = 'META',
  TIKTOK = 'TIKTOK',
}

export abstract class Analytics<T extends BaseAnalyticsEvent> {
  private _isReady: boolean
  private _eventQueue: T[]
  private _retryTimer: number | null

  constructor() {
    this._eventQueue = []
    this._isReady = false
    this._retryTimer = null
  }

  protected abstract readonly platform: AnalyticsPlatforms
  protected abstract initialize(): void
  protected abstract sendAnalyticsEvent(customEvent: T): void

  protected writeEventsToPlatform(): void {
    if (!this._isReady) {
      // One pending retry at most, however many events arrive before the platform is ready
      if (this._retryTimer === null) {
        this._retryTimer = window.setTimeout(() => {
          this._retryTimer = null
          this.writeEventsToPlatform()
        }, TIME_WAIT_FOR_READY_PLATFORM)
      }
      return
    }
    this._eventQueue.forEach((event) => {
      this.sendAnalyticsEvent(event)
    })
    this._eventQueue = []
  }

  public get isReady(): boolean {
    return this._isReady
  }

  public get eventQueue(): T[] {
    return [...this._eventQueue]
  }

  protected setIsReady(value: boolean): void {
    this._isReady = value
  }

  public processAnalyticsEvent(customEvent: T): void {
    this.addToEventQueue(customEvent)
    this.writeEventsToPlatform()
  }

  protected addToEventQueue(customEvent: T): void {
    this._eventQueue.push(customEvent)
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
      return Array.isArray(parsed) ? (parsed as T[]) : []
    }
    catch {
      return []
    }
  }
}
