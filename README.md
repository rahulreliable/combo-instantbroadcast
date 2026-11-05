# Instant Broadcast — Combo landing page

> **Current mode (5 Nov 2026): 7-day FREE trial, no prices on the page.** The popup collects name + WhatsApp (+ business) and which products to try (portal, AI Chatbot, AI Calling), saves the lead to `instantbroadcast.in/api/leads/special-offer` with source `combo_trial` (name tagged "| 7 din FREE trial", request number `IB-YYMMDD-XXXXX` in the description), fires Meta `Lead` (+ CAPI), and opens `/thank-you/` showing the request number, Start onboarding, Book a demo and WhatsApp. The popup also opens by itself 4 s after load, once per visit. The Razorpay notes below describe the earlier paid version; `worker.js` still has that API but the page no longer calls it.

Static site (no build step) for the combo offer: Instant Broadcast portal (web + app) at ₹15,000/year + 18% GST, with AI Chatbot and AI Calling as tick-to-add add-ons, and a free WhatsApp Showroom Kit with the yearly plan.

Deploy: Cloudflare Pages (or Workers static assets) from branch `main`, build command none, output directory `/`.

## Files
- `index.html` — the page
- `styles.css` — all styles (white + green, Inter)
- `app.js` — combo builder, cart totals, checkout drawer, video stories, sticky bar. **All prices and the checkout link live in `CONFIG` at the top.**
- `track.js` — Clarity (yd20prc2yj), GTM (GTM-WCGZZNWJ), UTM capture, IB visitor tracker, WhatsApp-tap events
- `assets/` — IB logo, client logos, customer video thumbnails, team photos, store badges (from instantbroadcast.in)
- `_headers`, `404.html`

## Razorpay setup (one time, in Cloudflare)
Worker → Settings → Variables and Secrets → add two **Secret** variables:
- `RAZORPAY_KEY_ID` — from Razorpay Dashboard → Account & Settings → API Keys (use `rzp_test_…` first to test)
- `RAZORPAY_KEY_SECRET` — the matching secret

Until both are set, `/api/order` answers 503 and the page shows "Payment abhi shuru nahi ho paya" with a WhatsApp fallback.

## Edit before ads go live
1. **Add-on prices** — set them in BOTH places: `CONFIG.items.*.price` in `app.js` (what the page shows) and `PRICES` in `worker.js` (what Razorpay charges). While `null`, the add-on is noted on the order but not charged.
2. **Showroom Kit contents** — the page says "WhatsApp QR stand"; change the text if needed.

## Checkout flow
Tick add-ons → "Checkout karo" → name + WhatsApp (+ business) → lead saved (source `combo_landing`) → `POST /api/order` (Worker computes the amount, creates the Razorpay order with a unique order number `IB-YYMMDD-XXXXX` as receipt) → Razorpay Checkout → `POST /api/verify` (signature check, order read back from Razorpay, sale saved to leads API with source `combo_purchase`) → `/thank-you/?order=IB-…`.

Thank-you page: order number (copy button), amount, payment ID, items; **Start onboarding** (onboarding.instantbroadcast.in/auth/facebook/onboarding/), **Book a demo** (pick day + slot, saved with source `combo_demo` and the order number), **WhatsApp** (pre-filled with the order number).

## Tracking events
- Meta Pixel 1191549192775541: PageView, AddToCart, InitiateCheckout, Lead (+ CAPI), AddPaymentInfo, **Purchase** (thank-you page, once per verified order, eventID = order number, + CAPI), Schedule (demo booked), Contact
- dataLayer (GTM): add_to_cart, begin_checkout, generate_lead, add_payment_info, purchase (transaction_id = order number), book_demo, start_onboarding, payment_failed, cta_click, whatsapp_click

## Recommended next
Add a Razorpay webhook (payment.captured) so a sale is recorded even if the buyer closes the browser before the thank-you page loads.
