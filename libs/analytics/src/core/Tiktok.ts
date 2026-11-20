import { type BaseAnalyticsEvent } from '../types/events'
import { Analytics, AnalyticsPlatforms } from './Analytics'

export interface TikTokPixelConfig {
  measurementId: string
}

export class TikTok extends Analytics {
  constructor(config: TikTokPixelConfig) {
    super(AnalyticsPlatforms.TIKTOK, config.measurementId)
  }

  protected initialize(): void {
    const snippetId = `tiktok-pixel-${this.measurementId}`
    if (document.querySelector(`script[data-id="${snippetId}"]`)) return
    // TikTok's snippet resets an existing ttq's methods, so beside the page's own pixel only load ours
    if (window.ttq) {
      window.ttq.load(this.measurementId)
      window.ttq.instance(this.measurementId).page()
      return
    }
    const script = document.createElement('script')
    script.setAttribute('data-id', snippetId)
    script.textContent = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"], ttq.setAndDefer = function (t, e) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
          }
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++
          )ttq.setAndDefer(e, ttq.methods[n]);
          return e
        }, ttq.load = function (e, n) {
          var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {};
          var o = document.createElement("script");
          o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t;
          var a = document.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(o, a)
        };

        ttq.load('${this.measurementId}');
        ttq.page();
      }(window, document, 'ttq');
      `
    document.head.appendChild(script)
  }

  protected sendAnalyticsEvent({ eventName, eventParams, eventId }: BaseAnalyticsEvent): void {
    if (!window.ttq) {
      console.error(`[${this.platform}] ttq is not defined`)
      return
    }
    const pixel = window.ttq.instance(this.measurementId)
    if (eventId) {
      pixel.track(eventName, eventParams, { event_id: eventId })
    }
    else {
      pixel.track(eventName, eventParams)
    }
  }
}
