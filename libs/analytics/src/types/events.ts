export interface BaseAnalyticsEvent {
  eventName: string
  eventParams: Record<string, unknown>
  /** Sent to Meta as `eventID` and TikTok as `event_id` to deduplicate with server-side events; GA4 has no equivalent. */
  eventId?: string
}
