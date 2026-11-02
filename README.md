# Instant Broadcast — Combo landing page

Static site (no build step) for the combo offer: Instant Broadcast portal (web + app) at ₹15,000/year + 18% GST, with AI Chatbot and AI Calling as tick-to-add add-ons, and a free WhatsApp Showroom Kit with the yearly plan.

Deploy: Cloudflare Pages (or Workers static assets) from branch `main`, build command none, output directory `/`.

## Files
- `index.html` — the page
- `styles.css` — all styles (white + green, Inter)
- `app.js` — combo builder, cart totals, checkout drawer, video stories, sticky bar. **All prices and the checkout link live in `CONFIG` at the top.**
- `track.js` — Clarity (yd20prc2yj), GTM (GTM-WCGZZNWJ), UTM capture, IB visitor tracker, WhatsApp-tap events
- `assets/` — IB logo, client logos, customer video thumbnails, team photos, store badges (from instantbroadcast.in)
- `_headers`, `404.html`

## Edit before ads go live
1. **Add-on prices** — `CONFIG.items.ai_chatbot.price` and `CONFIG.items.ai_calling.price` (yearly ₹ before GST). While `null`, the page says "Price team confirm karegi" and leaves them out of the total.
2. **Checkout link** — `CONFIG.checkoutUrl`. Now: IB sign-up on the yearly plan (`plan=38`) with `addons=` appended. Replace with a Razorpay payment link / cart URL when one exists for each combo.
3. **Showroom Kit contents** — the page says "WhatsApp QR stand"; change the text if the kit has more or less.

## Checkout flow
Tick add-ons → "Checkout karo" → name + WhatsApp number (+ business, optional) → lead saved to `instantbroadcast.in/api/leads/special-offer` (source `combo_landing`, with addons, cart total, UTMs) → redirect to `CONFIG.checkoutUrl`.

## Tracking events
- Meta Pixel 1191549192775541: PageView, AddToCart (each tick), InitiateCheckout (drawer opens), Lead (form submit, + same Lead via `instantbroadcast.in/api/tracking/meta-capi` with the same event id), Contact (WhatsApp taps)
- dataLayer (GTM): add_to_cart, begin_checkout, generate_lead, cta_click, video_review_click, whatsapp_click
- **Purchase** is not fired here — it has to fire on the payment success page.
