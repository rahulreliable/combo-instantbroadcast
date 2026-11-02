// Cloudflare Worker for the combo page: creates Razorpay orders and verifies payments.
// Static files (index.html, thank-you, assets) are served by Workers static assets;
// only /api/* reaches this code (see run_worker_first in wrangler.toml).
//
// Secrets to set once in Cloudflare (Worker → Settings → Variables and Secrets, type "Secret"):
//   RAZORPAY_KEY_ID      e.g. rzp_live_xxxxxxxx   (rzp_test_… for testing)
//   RAZORPAY_KEY_SECRET  the matching key secret
// Never put these in this file or anywhere in the repo.

// Server-side prices (₹ per year, before GST). The page shows the same numbers from CONFIG in app.js —
// keep both in step. An add-on with price null is recorded on the order but not charged
// (the team confirms its price separately).
const PRICES = {
  portal: 15000,
  ai_chatbot: null,
  ai_calling: null
};
const GST_RATE = 0.18;
const ADDON_NAMES = { ai_chatbot: 'AI Chatbot', ai_calling: 'AI Calling agent' };
const LEADS_API = 'https://instantbroadcast.in/api/leads/special-offer';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

// Unique, readable order number: IB-YYMMDD-XXXXX (no 0/O/1/I to avoid misreading on calls)
function orderNumber() {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000); // IST date
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let code = '';
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `IB-${ymd}-${code}`;
}

function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max); }

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function rzpAuth(env) { return 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`); }

async function createOrder(request, env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return json({ ok: false, error: 'payments_not_configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 10).replace(/\D/g, '');
  const business = clean(body.business, 100);
  const addons = Array.isArray(body.addons) ? [...new Set(body.addons.filter(a => a in ADDON_NAMES))] : [];
  if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) return json({ ok: false, error: 'bad_details' }, 400);

  let subtotal = PRICES.portal;
  const unpriced = [];
  for (const a of addons) { if (PRICES[a] == null) unpriced.push(a); else subtotal += PRICES[a]; }
  const total = Math.round(subtotal * (1 + GST_RATE));
  const orderNo = orderNumber();

  const items = ['Instant Broadcast portal (yearly)'].concat(addons.map(a => ADDON_NAMES[a] + (PRICES[a] == null ? ' (price to confirm)' : ''))).concat(['WhatsApp Showroom Kit (free)']);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: rzpAuth(env) },
    body: JSON.stringify({
      amount: total * 100, // paise
      currency: 'INR',
      receipt: orderNo,
      notes: {
        order_no: orderNo,
        name, phone: '+91' + phone, business,
        items: items.join(' + ').slice(0, 250),
        addons: addons.join(','),
        unpriced_addons: unpriced.join(','),
        utm_campaign: clean(body.utm_campaign, 120),
        utm_content: clean(body.utm_content, 120),
        source: 'combo_landing'
      }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    console.log('razorpay order error', res.status, t.slice(0, 300));
    return json({ ok: false, error: 'order_failed' }, 502);
  }
  const order = await res.json();
  return json({ ok: true, key: env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency, orderNo, items, unpriced });
}

async function verifyPayment(request, env, ctx) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return json({ ok: false, error: 'payments_not_configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const orderId = clean(body.razorpay_order_id, 40);
  const paymentId = clean(body.razorpay_payment_id, 40);
  const signature = clean(body.razorpay_signature, 128);
  if (!orderId || !paymentId || !signature) return json({ ok: false, error: 'missing_fields' }, 400);

  const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
  if (!safeEqual(expected, signature)) return json({ ok: false, error: 'bad_signature' }, 400);

  // Read the order back from Razorpay so the amount and details come from Razorpay, not the browser
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: rzpAuth(env) } });
  if (!res.ok) return json({ ok: false, error: 'order_lookup_failed' }, 502);
  const order = await res.json();
  const n = order.notes || {};
  const amount = Math.round((order.amount || 0) / 100);

  // Record the sale in Instant Broadcast's leads list so the team sees it straight away
  ctx.waitUntil(fetch(LEADS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: String(n.phone || '').replace(/^\+91/, ''), name: n.name || '', email: '', source: 'combo_purchase', couponCode: '',
      message: `PAID ₹${amount} · Order ${n.order_no} · Razorpay ${paymentId} · ${n.items || ''}` +
        (n.unpriced_addons ? ` · Add-on price to confirm: ${n.unpriced_addons}` : '') + (n.business ? ` · Business: ${n.business}` : ''),
      company: n.business || '', orderNo: n.order_no, paymentId, razorpayOrderId: orderId, amountPaid: amount,
      addons: n.addons || '', utm_campaign: n.utm_campaign || '', utm_content: n.utm_content || ''
    })
  }).catch(() => {}));

  return json({ ok: true, orderNo: n.order_no || order.receipt, paymentId, amount, items: (n.items || '').split(' + ').filter(Boolean), name: n.name || '' });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/order' && request.method === 'POST') return createOrder(request, env);
    if (url.pathname === '/api/verify' && request.method === 'POST') return verifyPayment(request, env, ctx);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  }
};
