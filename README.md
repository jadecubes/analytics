<p align="center">
  <img src="https://raw.githubusercontent.com/jadecubes/analytics/main/.github/assets/logo.svg" alt="Analytics Logo" />
</p>

<p align="center">

[![npm version](https://img.shields.io/npm/v/@jadecubes/analytics.svg)](https://www.npmjs.com/package/@jadecubes/analytics)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@jadecubes/analytics)](https://bundlephobia.com/package/@jadecubes/analytics)
[![Build Status](https://img.shields.io/github/actions/workflow/status/jadecubes/analytics/ci.yml?branch=main)](https://github.com/jadecubes/analytics/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/jadecubes/analytics/blob/main/LICENSE)

</p>

<p align="center">
  <b>One TypeScript API for loading GA4, Meta Pixel and TikTok Pixel and sending events to each</b>
</p>

---

`@jadecubes/analytics` loads each platform's script once, sends each event only to the property or pixel you configured, and can hold an event fired right before a page navigation until the next page. It works in React or any other front-end. You still send each platform its own event name: GA4's `add_to_cart` is Meta's and TikTok's `AddToCart`. See the limitations below.

## 🚀 Getting Started

### Installation

```bash
npm install @jadecubes/analytics
# or
pnpm add @jadecubes/analytics
```

### Set up

Call this once, on the client, before you send anything:

```typescript
import { createAnalyticsProviders, AnalyticsPlatforms } from '@jadecubes/analytics'

createAnalyticsProviders({
  [AnalyticsPlatforms.GA]: { measurementId: 'G-XXXXXXXXXX' },
  [AnalyticsPlatforms.META]: { measurementId: 'YOUR_META_PIXEL_ID' },
  [AnalyticsPlatforms.TIKTOK]: { measurementId: 'YOUR_TIKTOK_PIXEL_ID' },
})
```

### Send events

```typescript
import { getAnalyticsInstance, AnalyticsPlatforms } from '@jadecubes/analytics'

getAnalyticsInstance(AnalyticsPlatforms.GA)?.processAnalyticsEvent({
  eventName: 'add_to_cart',
  eventParams: { currency: 'USD', value: 99.99, items: [{ item_id: 'SKU_12345', price: 99.99 }] },
})

getAnalyticsInstance(AnalyticsPlatforms.META)?.processAnalyticsEvent({
  eventName: 'AddToCart',
  eventParams: { content_ids: ['SKU_12345'], content_type: 'product', value: 99.99, currency: 'USD' },
  eventId: 'cart-12345',
})

getAnalyticsInstance(AnalyticsPlatforms.TIKTOK)?.processAnalyticsEvent({
  eventName: 'AddToCart',
  eventParams: { content_id: 'SKU_12345', value: 99.99, currency: 'USD' },
  eventId: 'cart-12345',
})
```

- The event goes to the platform straight away. Until the platform's script loads, its own stub (`gtag`, `fbq`, `ttq`) holds it, so you can send right after setup.
- It reaches only the configured id, not other properties or pixels the page runs: GA4 with `send_to`, Meta with `fbq('trackSingle')` (`trackSingleCustom` for names outside Meta's [standard events](https://developers.facebook.com/docs/meta-pixel/reference#standard-events)), TikTok with `ttq.instance(id)`. Untargeted calls the page makes itself, such as a global `ttq.track(...)`, still reach every pixel, including ours.
- `eventId`, if set, goes to Meta as `eventID` and to TikTok as `event_id`, so they can deduplicate it against the same event sent from your server. GA4 has no equivalent.

### Events right before a page navigation

An event sent just before a full-page navigation (a link, a form submit, `window.location = …`) can be lost when the page unloads. `sendAnalyticsPendingEvent` saves it in `sessionStorage` instead, and the platform sends it the next time it is set up, on the next page:

```typescript
getAnalyticsInstance(AnalyticsPlatforms.META)?.sendAnalyticsPendingEvent({
  eventName: 'InitiateCheckout',
  eventParams: { value: 99.99, currency: 'USD' },
  eventId: 'checkout-12345',
})
window.location.href = '/checkout'
```

- Pending events are kept per platform and id, so call it on every platform that should receive the event.
- The event is sent from the next page, so the platform records that page and time. Put anything you need from the current page in `eventParams`.
- `sessionStorage` is per tab and per origin (scheme, host and port). If the navigation doesn't happen or leaves the origin, the event is sent the next time this tab sets the platform up on this origin, late and attributed to that page.
- If `sessionStorage` is unavailable, the event is sent immediately instead.

### Using it in React

Call `createAnalyticsProviders` in your client entry file, before the first render. `getAnalyticsInstance` returns `undefined` until it has run, and React runs child effects before a parent's `useEffect`, so setting it up inside `App` would drop events that children send on mount. On the server it does nothing.

```tsx
// main.tsx
import { createRoot } from 'react-dom/client'
import { createAnalyticsProviders, AnalyticsPlatforms } from '@jadecubes/analytics'
import { App } from './App'

createAnalyticsProviders({ [AnalyticsPlatforms.GA]: { measurementId: 'G-XXXXXXXXXX' } })

createRoot(document.getElementById('root')!).render(<App />)
```

```tsx
// PurchaseButton.tsx
import { getAnalyticsInstance, AnalyticsPlatforms } from '@jadecubes/analytics'

export function PurchaseButton() {
  const handlePurchase = () => {
    getAnalyticsInstance(AnalyticsPlatforms.GA)?.processAnalyticsEvent({
      eventName: 'purchase',
      eventParams: { transaction_id: 'T_12345', value: 299.99, currency: 'USD' },
    })
  }

  return <button onClick={handlePurchase}>Buy</button>
}
```

---

## 📖 API

| Export | What it does |
|---|---|
| `createAnalyticsProviders(config: AnalyticsConfig): void` | Sets up each platform in `config` once. Skips platforms with an empty id, keeps the first instance and warns if a platform is set up again with another id, and does nothing without `window`. |
| `getAnalyticsInstance(platform: AnalyticsPlatforms): Analytics \| undefined` | Returns the platform set up by `createAnalyticsProviders`, or `undefined` if it wasn't. |
| `instance.processAnalyticsEvent(event: BaseAnalyticsEvent): void` | Sends the event to this platform now. Errors are logged, never thrown. |
| `instance.sendAnalyticsPendingEvent(event: BaseAnalyticsEvent): void` | Saves the event and sends it when this platform and id are next set up. Sends it now if `sessionStorage` is unavailable. |
| `instance.measurementId` | The id this platform was set up with. |
| `AnalyticsPlatforms` | `GA`, `META`, `TIKTOK`. |
| Types | `AnalyticsConfig`, `BaseAnalyticsEvent` (`eventName`, `eventParams`, optional `eventId`), `Analytics`, `GA4Config`, `MetaPixelConfig`, `TikTokPixelConfig`. |

---

## ⚠️ Limitations

- **One call per platform.** There is no single event that is translated into each platform's event name and parameters.
- **No consent handling.** Scripts load as soon as you call `createAnalyticsProviders`; with a consent banner, call it only once the user agrees. Events sent before then are dropped, because `getAnalyticsInstance` returns `undefined`.
- **Page views only at setup.** The library sends one page view per platform when it is set up and none on route changes in a single-page app. GA4's enhanced measurement and the Meta Pixel may record history changes on their own, so check before sending your own route-change page views.
- **No user identity.** There is no `identify` call.

---

## ⚖️ Compared with the `analytics` npm package

[`analytics`](https://github.com/DavidWells/analytics) is the closest widely used library (0.8.19 as of November 2026). Cells marked * describe `analytics` as far as its documentation shows; they haven't been tested here.

| | `@jadecubes/analytics` | `analytics` |
|---|---|---|
| Sending an event | One call per platform, using that platform's event name | One `track()` call, sent to every enabled plugin |
| Platforms | GA4, Meta Pixel and TikTok Pixel built in | Plugins: official ones (GA and others), community ones for Meta and TikTok* |
| Adding a platform | Change the library | Write or install a plugin |
| Translating one event into each platform's event and parameters | No | No: each plugin receives the same name |
| Changing or blocking events before they're sent (consent, personal data) | No | Lifecycle hooks, and plugins can be turned off* |
| User identity and page views | No `identify`; the library sends one page view per platform at setup, none on route changes | `identify`, `page`, `reset`* |
| Events fired right before a page navigation | `sendAnalyticsPendingEvent` saves them and sends them on the next page | Not built in* |
| Deduplicating with server-side events | `eventId` sent to Meta (`eventID`) and TikTok (`event_id`) | Up to each plugin* |
| Pages that already run other properties or pixels | Sends only to the configured id (`send_to`, `trackSingle`, `ttq.instance`) | Up to each plugin* |
| Server-side rendering | Setup does nothing on the server | Designed to run on the server too* |
| Event typing | `eventParams: Record<string, unknown>` | Loose payload types* |
| Size | About 2.2 kB gzipped (ES build) | Core plus each plugin |
| Maturity | Early (0.0.x), few users | Years of use, many plugins, still maintained |

---

## 🤝 Contributing

Development setup, scripts and publishing steps are in [CONTRIBUTING.md](https://github.com/jadecubes/analytics/blob/main/CONTRIBUTING.md).

## 📄 License

[MIT](https://github.com/jadecubes/analytics/blob/main/LICENSE)
