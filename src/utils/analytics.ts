/**
 * analytics.ts — Centralny moduł GTM dataLayer push.
 *
 * Użycie (server-side w .astro):
 *   ---
 *   import { trackEvent } from '../utils/analytics';
 *   ---
 *   <a href="/events/havan-30-06" data-event="signup-havan" data-event-data={JSON.stringify({havan_id, date, location})}>
 *
 * LUB inline (client-side w .astro):
 *   <script>
 *     import { track } from '../utils/analytics-client';
 *     document.querySelectorAll('[data-event]').forEach(el => {
 *       el.addEventListener('click', (e) => {
 *         const data = el.dataset.eventData ? JSON.parse(el.dataset.eventData) : {};
 *         track(el.dataset.event, data);
 *       });
 *     });
 *   </script>
 */

export type EventData = Record<string, string | number | boolean>;

export interface AnalyticsEvent {
  event: string;
  [key: string]: string | number | boolean;
}

/**
 * Push event do dataLayer (wywoływane z .astro po stronie klienta).
 * Jeśli GTM nie jest załadowany, nic się nie dzieje (bezpieczne).
 */
export function track(event: string, data: EventData = {}): void {
  if (typeof window === 'undefined') return; // SSR guard
  if (typeof (window as any).dataLayer === 'undefined') {
    (window as any).dataLayer = [];
  }
  (window as any).dataLayer.push({
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Track pageview z dodatkowymi parametrami (np. content_group).
 * Wywołuj raz na każdej stronie (opcjonalnie).
 */
export function trackPageView(extra: EventData = {}): void {
  track('page_view_consented', {
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    ...extra,
  });
}

/**
 * Predefiniowane eventy dla babaji.org.pl — type-safe.
 */
export const EVENTS = {
  signUpHavan: (havan_id: string, havan_date: string, havan_location: string) =>
    track('sign_up_havan', { havan_id, havan_date, havan_location }),

  clickDonate: (amount: number, currency: string) =>
    track('click_donate', { donate_amount: amount, donate_currency: currency }),

  contactFormSubmit: () => track('contact_form_submit'),

  newsletterSignup: (source: string) => track('newsletter_signup', { newsletter_source: source }),

  languageSwitch: (from: string, to: string) =>
    track('language_switch', { from_lang: from, to_lang: to }),

  outboundLink: (url: string, host: string) =>
    track('outbound_link', { outbound_url: url, outbound_host: host }),

  fileDownload: (file_name: string, file_type: string) =>
    track('file_download', { file_name, file_type }),

  videoPlay: (video_title: string, video_duration: number) =>
    track('video_play', { video_title, video_duration }),

  scrollDepth: (percent: number) => track('scroll_depth', { scroll_percent: percent }),
};
