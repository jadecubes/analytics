/**
 * https://developers.facebook.com/docs/meta-pixel/reference/#reference, e.g. fbq('track', eventName, eventParams);
 * https://developers.google.com/analytics/devguides/collection/ga4/events?client_type=gtag&sjid=8862249207170699049-AP, e.g. gtag('event', eventName, eventParams);
 * https://ads.tiktok.com/help/article/standard-events-parameters?lang=en, e.g. ttq.track(eventName, eventParams);
 *
 * Event list,
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#add_to_cart
 */
export interface BaseAnalyticsEvent {
  eventName: string
  eventParams: Record<string, unknown>
  /**
   * Unique ID for deduplicating with server-side events. Sent to Meta as `eventID` and to
   * TikTok as `event_id`; GA4 has no equivalent, so Ga ignores it.
   */
  eventId?: string
}
