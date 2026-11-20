<p align="center">
  <img src=".github/assets/logo.svg" alt="Analytics Logo" />
</p>

<p align="center">

[![npm version](https://img.shields.io/npm/v/@jadecubes/analytics.svg)](https://www.npmjs.com/package/@jadecubes/analytics)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@jadecubes/analytics)](https://bundlephobia.com/package/@jadecubes/analytics)
[![Build Status](https://img.shields.io/github/actions/workflow/status/jadecubes/Analytics/ci.yml?branch=main)](https://github.com/jadecubes/Analytics/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

</p>

<p align="center">
  <b>A unified TypeScript library for tracking analytics across Google Analytics 4, Meta (Facebook) Pixel, and TikTok Pixel</b>
</p>

<p align="center">
  Works in React apps or any other front-end
</p>

---

## 🎯 Why Analytics?

Modern front-ends often require multiple analytics platforms. Analytics offers:
- The **same API** for GA4, Meta Pixel, and TikTok Pixel.
- Loads each platform's script **once**; events sent before it finishes loading wait in the platform's own queue.
- Built with **TypeScript**: exports `BaseAnalyticsEvent`, `AnalyticsConfig` and each platform's config type.
- **Framework-agnostic**: plain functions you can call from React or any other code.

---

## 🧑‍💻 Who Should Use It?

- Front-end engineers who want to track events across multiple analytics platforms.
- Teams looking for a shared analytics library with a consistent API.
- Developers who want one small API over the three platforms' scripts.

---

## 🚀 Getting Started

### Installation

```bash
npm install @jadecubes/analytics
# or
pnpm add @jadecubes/analytics
# or
yarn add @jadecubes/analytics
```

### Basic Usage

```typescript
import { createAnalyticsProviders, AnalyticsPlatforms } from '@jadecubes/analytics'

// Initialize analytics providers at app startup
createAnalyticsProviders({
  [AnalyticsPlatforms.GA]: {
    measurementId: 'G-XXXXXXXXXX'
  },
  [AnalyticsPlatforms.META]: {
    measurementId: 'YOUR_META_PIXEL_ID'
  },
  [AnalyticsPlatforms.TIKTOK]: {
    measurementId: 'YOUR_TIKTOK_PIXEL_ID'
  }
})
```

### Track Events

```typescript
import { getAnalyticsInstance, AnalyticsPlatforms } from '@jadecubes/analytics'

// Get analytics instance for a specific platform
const ga = getAnalyticsInstance(AnalyticsPlatforms.GA)
const meta = getAnalyticsInstance(AnalyticsPlatforms.META)
const tiktok = getAnalyticsInstance(AnalyticsPlatforms.TIKTOK)

// Track events for Google Analytics 4
ga?.processAnalyticsEvent({
  eventName: 'add_to_cart',
  eventParams: {
    currency: 'USD',
    value: 99.99,
    items: [
      {
        item_id: 'SKU_12345',
        item_name: 'Product Name',
        price: 99.99
      }
    ]
  }
})

// Track events for Meta (Facebook) Pixel
meta?.processAnalyticsEvent({
  eventName: 'AddToCart',
  eventParams: {
    content_name: 'Product Name',
    content_ids: ['SKU_12345'],
    content_type: 'product',
    value: 99.99,
    currency: 'USD'
  }
})

// Track events for TikTok Pixel
tiktok?.processAnalyticsEvent({
  eventName: 'AddToCart',
  eventParams: {
    content_id: 'SKU_12345',
    content_name: 'Product Name',
    value: 99.99,
    currency: 'USD'
  }
})
```

### Understanding Event Processing

The `processAnalyticsEvent` method:
- Hands the event to the platform straight away. Until the platform's script loads, its own stub (`gtag`, `fbq`, `ttq`) holds the event, so you can call it right after initialization
- Sends each event only to the configured property or pixel, not to others the page may also run: GA4 with `send_to`, Meta with `fbq('trackSingle')` (or `trackSingleCustom` for names outside Meta's [standard events](https://developers.facebook.com/docs/meta-pixel/reference#standard-events)), TikTok with `ttq.instance(id)`
- Passes `eventId`, if you set one, to Meta (`eventID`) and TikTok (`event_id`) so they can deduplicate it against server-side events

### Events Right Before a Page Navigation

An event sent just before a full-page navigation (a link, a form submit, `window.location = …`) can be lost when the page unloads. `sendAnalyticsPendingEvent` saves the event in `sessionStorage` instead, and the platform sends it the next time it is initialized, on the next page:

```typescript
const meta = getAnalyticsInstance(AnalyticsPlatforms.META)

meta?.sendAnalyticsPendingEvent({
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

### Using It in React

Call `createAnalyticsProviders` in your client entry file, before the first render. `getAnalyticsInstance` returns `undefined` until it has run, and React runs child effects before a parent's `useEffect`, so setting it up inside `App` would drop events that children send on mount. On the server it does nothing.

```tsx
// main.tsx
import { createRoot } from 'react-dom/client'
import { createAnalyticsProviders, AnalyticsPlatforms } from '@jadecubes/analytics'
import { App } from './App'

createAnalyticsProviders({
  [AnalyticsPlatforms.GA]: { measurementId: 'G-XXXXXXXXXX' },
  [AnalyticsPlatforms.META]: { measurementId: 'YOUR_PIXEL_ID' },
})

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
    getAnalyticsInstance(AnalyticsPlatforms.META)?.processAnalyticsEvent({
      eventName: 'Purchase',
      eventParams: { value: 299.99, currency: 'USD' },
    })
  }

  return <button onClick={handlePurchase}>Buy</button>
}
```

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
| User identity and page views | No `identify`; one page view per platform at setup, none on route changes | `identify`, `page`, `reset`* |
| Events fired right before a page navigation | `sendAnalyticsPendingEvent` saves them and sends them on the next page | Not built in* |
| Deduplicating with server-side events | `eventId` sent to Meta (`eventID`) and TikTok (`event_id`) | Up to each plugin* |
| Pages that already run other properties or pixels | Sends only to the configured id (`send_to`, `trackSingle`, `ttq.instance`) | Up to each plugin* |
| Server-side rendering | Setup does nothing on the server | Designed to run on the server too* |
| Event typing | `eventParams: Record<string, unknown>` | Loose payload types* |
| Size | About 2.2 kB gzipped (ES build) | Core plus each plugin |
| Maturity | Early (0.0.x), few users | Years of use, many plugins, still maintained |

---

## 📦 Publishing to npm

This library is published as `@jadecubes/analytics` on npm. If you're a maintainer, follow these steps to publish a new version:

### Prerequisites

1. **npm Account**: Ensure you have an npm account and are logged in
   ```bash
   npm login
   ```

2. **Organization Access**: You need publish access to the `@jadecubes` organization on npm

### Publishing Steps

1. **Update Version**: Update the version in `libs/analytics/package.json` following [semantic versioning](https://semver.org/):
   - **Patch** (0.0.x): Bug fixes
   - **Minor** (0.x.0): New features, backward compatible
   - **Major** (x.0.0): Breaking changes

   ```bash
   # Edit libs/analytics/package.json and update the version field
   # For example: "version": "0.0.2"
   ```

2. **Build the Library**:
   ```bash
   pnpm build
   ```

3. **Test the Build**: Verify the build output in `dist/libs/analytics/`
   ```bash
   ls -la dist/libs/analytics/
   ```

4. **Copy package.json and README.md to dist**: both need to be in the published directory
   ```bash
   cp libs/analytics/package.json README.md dist/libs/analytics/
   ```

5. **Publish to npm**:
   ```bash
   cd dist/libs/analytics
   npm publish --access public
   ```

### Automated Publishing (Recommended)

The root `package.json` already has a publish script:

```json
{
  "scripts": {
    "publish:analytics": "pnpm build && cp libs/analytics/package.json README.md dist/libs/analytics/ && cd dist/libs/analytics && npm publish --access public"
  }
}
```

Then simply run:
```bash
pnpm publish:analytics
```

### Publishing Beta/Alpha Versions

For pre-release versions:

```bash
# Update version to include tag, e.g., "0.1.0-beta.1"
cd dist/libs/analytics
npm publish --access public --tag beta
```

---

## 🛠️ Development

### Project Structure

```
Analytics/
├── libs/
│   └── analytics/          # Main analytics library
│       ├── src/
│       │   ├── core/       # Core analytics implementations
│       │   ├── createAnalyticsProviders.ts  # Set up platforms, get instances
│       │   └── types/      # TypeScript types
│       └── vite.config.ts  # Vite build configuration
└── tools/                  # Build and development tools
```

### Available Scripts

```bash
# Build the library
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint
```
