# Google Analytics (GA4)

Property tag: `G-Q30CGRHEZN`, loaded by `src/components/Analytics/GoogleAnalytics.tsx`
from the root layout. It reports only from the live site — local dev, Vercel
previews and `/studio` are excluded — and every helper in
`src/lib/analytics/gtag.ts` no-ops when gtag hasn't loaded.

Event names follow GA4's recommended set wherever one exists. That's what makes
them land in the built-in reports instead of sitting as unmapped custom events.

## What is collected, and where it shows up in GA

### Reports → Life cycle → Acquisition / Engagement (automatic)

Collected by the tag itself, no code involved: `page_view` (including App Router
client-side navigation, via Enhanced measurement's history-event tracking),
`session_start`, `first_visit`, `user_engagement`, `scroll` (90 % depth),
`click` on outbound links, `file_download`, plus device, geo, language,
traffic source and landing page.

### Reports → Monetization → Ecommerce purchases / Purchase journey

| Event | Fired from | When |
| --- | --- | --- |
| `view_item_list` | `Analytics/TrackListView` via `Blocks/ProductList`, `Blocks/TicketList` | A shop or screening list renders on the page |
| `select_item` | `ProductList/ProductGrid`, `TicketList/TicketGate` | A product card or ticket card is clicked |
| `view_item` | `Analytics/TrackItemView`, `TicketList/TicketGate` | Product page opens; ticket gate opens (the modal *is* the ticket's detail view) |
| `begin_checkout` | `useBuyProduct`, `useMembershipGate` | Just before the redirect to Stripe — for a product, a ticket, or a membership |
| `purchase` | `Analytics/PurchaseTracker` | Stripe returns the buyer with a `session_id` that `/api/analytics/purchase` confirms as paid |

`item_category` splits revenue three ways: **Produkt**, **Biljett**,
**Medlemskap**. `item_variant` carries the product size or the screening venue.
`transaction_id` is the Stripe session id, so a refresh of the thank-you page
can't double-count (the tracker also remembers sent ids in `sessionStorage`).

There is no cart in this shop — buying goes straight from item to Stripe — so
`add_to_cart` is deliberately absent and the funnel reads
view_item → begin_checkout → purchase.

### Reports → Engagement → Events (custom)

| Event | Meaning | Key params |
| --- | --- | --- |
| `sign_up` | Membership paid for and joined | `method` |
| `ticket_gate_step` | Each step of the members-only gate — the drop-off funnel | `gate_step` (`choice`/`join`/`code`/`joined`/`already`/`disabled`), `item_id`, `item_name` |
| `select_size` | A product size was picked, including sizes nobody buys | `item_id`, `item_variant` |
| `trailer_open` | A trailer overlay was opened | `video_platform`, `video_id`, `video_title` |
| `contact_email_copy` | Footer email copied — invisible to outbound-click tracking | `link_url` |
| `page_not_found` | A 404 was rendered | `page_path`, `page_referrer` |
| `exception` | A checkout, membership or network failure | `description` (e.g. `ticket_checkout:invalid_code`), `item_id` |

Video playback (`video_start`, `video_progress`, `video_complete`) comes from
Enhanced measurement: the YouTube embed URL sets `enablejsapi=1` for exactly
that reason. Vimeo can't be instrumented by GA — `trailer_open` is the only
signal there.

## Implementation notes

- `dataLayer` and `gtag` are defined by an inline script in the server-rendered
  HTML, and only the gtag.js library itself loads `afterInteractive`. Without
  that, the first effects on a page (`view_item`, `view_item_list`) run before
  gtag exists and their events are dropped — measured, not theoretical.
- `view_item_list` fires on render rather than on scroll. Impressions therefore
  count "the list was on the page", and a block rendered twice for
  responsiveness must still mount one tracker (see `Blocks/TicketList`).
- There's no official Google npm package for GA4 on the web; gtag.js is the
  integration. `@next/third-parties/google` was considered and skipped — it
  covers only the script loader and a `dataLayer` push helper, both of which
  are ~30 lines here.

## One-time setup in the GA UI

Code alone doesn't finish the job. In **Admin** for the property:

1. **Data streams → the web stream → Enhanced measurement** — switch it on and
   keep every sub-toggle enabled, especially *Page views → advanced settings →
   page changes based on browser history events* (this site is a SPA) and
   *Video engagement*.
2. **Custom definitions → Custom dimensions** — register these event-scoped
   params, otherwise they're collected but not reportable:
   `gate_step`, `purchase_type`, `checkout_type`, `video_platform`,
   `video_title`, `page_path`, `description`. (`item_category`, `item_variant`,
   `item_list_name` are item-scoped and already built in.)
3. **Events → Mark as key event** — at minimum `purchase` and `sign_up`;
   `begin_checkout` if you want the funnel scored.
4. **Data settings → Data retention** — raise from the default 2 months to 14
   months, or explorations can't look back further.
5. **Reports → Library** — publish the *Monetization* collection if it isn't
   already; it's hidden by default on new properties.

## Consent

There is no consent banner on the site, and the tag currently fires for every
visitor. GA4's cookies are not strictly necessary under GDPR/ePrivacy, so a
Swedish-market site should gate this behind consent — Google Consent Mode v2
with `analytics_storage: denied` by default, flipped on acceptance. Not
implemented.
