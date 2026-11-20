/**
 * Event names and parameters are each platform's own:
 * GA4 https://developers.google.com/analytics/devguides/collection/ga4/reference/events,
 * Meta https://developers.facebook.com/docs/meta-pixel/reference#standard-events,
 * TikTok https://ads.tiktok.com/help/article/standard-events-parameters
 */
export interface BaseAnalyticsEvent {
  eventName: string
  eventParams: Record<string, unknown>
  /** Sent to Meta as `eventID` and TikTok as `event_id` to deduplicate with server-side events; GA4 has no equivalent. */
  eventId?: string
}
