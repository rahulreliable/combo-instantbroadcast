// Thank-you page: order details, Purchase tracking (once per order), self-serve demo booking, onboarding + WhatsApp links.
(function () {
  'use strict';
  var d = document;
  var $ = function (s) { return d.querySelector(s); };
  function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var WA = '919228173004';
  var LEADS_API = 'https://instantbroadcast.in/api/leads/special-offer';
  var CAPI = 'https://instantbroadcast.in/api/tracking/meta-capi';
  var ORDER_RE = /^IB-\d{6}-[A-Z2-9]{5}$/;

  var o = {};
  try { o = JSON.parse(get('ib_order') || '{}') || {}; } catch (e) {}
  var qNo = (new URLSearchParams(location.search).get('order') || '').toUpperCase();
  var orderNo = ORDER_RE.test(o.orderNo || '') ? o.orderNo : (ORDER_RE.test(qNo) ? qNo : '');
  var first = String(o.name || '').split(' ')[0];

  // 1. Order details (text only, never HTML)
  var isTrial = o.kind === 'trial' || !o.paymentId;
  if (isTrial) {
    if (first) $('#ty-title').textContent = 'Shukriya, ' + first + '! 7 din FREE trial request mil gaya.';
  } else {
    if (first) $('#ty-title').textContent = 'Shukriya, ' + first + '! Payment ho gaya.';
    $('#ty-sub').textContent = 'Aapka order confirm hai. Order number sambhal ke rakhein — support pe yahi poocha jayega.';
    $('#o-label').textContent = 'Order number';
    $('#o-amt-l').textContent = 'Amount paid';
    $('#o-pay-row').hidden = false;
  }
  if (orderNo) $('#o-no').textContent = orderNo;
  if (o.amount && !isTrial) $('#o-amt').textContent = inr(o.amount) + ' (GST ke saath)';
  if (o.items && o.items.length) $('#o-items').textContent = o.items.join(' + ');
  if (o.paymentId) $('#o-pay').textContent = o.paymentId;
  if (o.verified === false) $('#o-pending').hidden = false;
  if (!orderNo && !o.paymentId) {
    $('#ty-title').textContent = 'Welcome to Instant Broadcast';
    $('#ty-sub').textContent = 'Order ki details nahi mili. Payment kiya hai toh WhatsApp pe Razorpay payment ID bhejein — hum turant confirm kar denge.';
    $('#order').hidden = true;
  }

  $('#o-copy').addEventListener('click', function () {
    var btn = this;
    var done = function () { btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(orderNo).then(done, function () {});
    else { var r = d.createRange(); r.selectNodeContents($('#o-no')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { d.execCommand('copy'); done(); } catch (e) {} }
  });

  // 2. WhatsApp + onboarding links carry the order number
  var waText = (isTrial ? 'Hi, maine Instant Broadcast ka 7 din FREE trial maanga hai.' : 'Hi, maine Instant Broadcast combo kharida hai.') + (orderNo ? (isTrial ? ' Request: ' : ' Order: ') + orderNo + '.' : '') + (o.name ? ' Naam: ' + o.name + '.' : '') + ' [combo-lp]';
  $('#go-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText);
  function dl(x) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(x); }
  $('#go-onboard').addEventListener('click', function () { dl({ event: 'start_onboarding', order_no: orderNo }); });
  $('#go-wa').addEventListener('click', function () { dl({ event: 'thankyou_whatsapp', order_no: orderNo }); });

  // 3. Purchase — once per verified order (refresh or direct visits don't count)
  if (o.verified && orderNo && o.amount && !get('ib_purchase_fired_' + orderNo)) {
    set('ib_purchase_fired_' + orderNo, '1');
    var ids = ['portal'].concat(o.addons || []);
    try { window.fbq && window.fbq('track', 'Purchase', { value: o.amount, currency: 'INR', content_ids: ids, content_type: 'product', num_items: ids.length, order_id: orderNo }, { eventID: orderNo }); } catch (e) {}
    dl({ event: 'purchase', ecommerce: { transaction_id: orderNo, value: o.amount, currency: 'INR', items: ids.map(function (i) { return { item_id: i }; }) } });
    try {
      fetch(CAPI, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'omit',
        body: JSON.stringify({ eventName: 'Purchase', eventId: orderNo, customData: { value: o.amount, currency: 'INR', content_ids: ids, order_id: orderNo }, userData: { phone: /^[6-9]\d{9}$/.test(o.phone || '') ? '+91' + o.phone : undefined }, eventSourceUrl: location.href })
      }).catch(function () {});
    } catch (e) {}
  }

  // 4. Self-serve demo booking: next 6 working days (no Sunday), 3 slots in IST
  var SLOTS = [['10–1', '10 AM – 1 PM', 13], ['1–4', '1 PM – 4 PM', 16], ['4–7', '4 PM – 7 PM', 19]];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function ist() { var n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 330) * 60000); }
  var now = ist(), days = [];
  for (var i = 0; days.length < 6 && i < 10; i++) {
    var dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (dt.getDay() === 0) continue;
    if (i === 0 && now.getHours() >= 18) continue; // too late for today
    days.push({ dt: dt, today: i === 0, label: i === 0 ? 'Aaj' : (i === 1 ? 'Kal' : DAYS[dt.getDay()]), date: dt.getDate() + ' ' + MONTHS[dt.getMonth()] });
  }
  var st = { day: null, slot: null, sent: false };
  var dayWrap = $('#d-days'), slotWrap = $('#d-slots');
  function chip(html, on, dis) {
    var b = d.createElement('button'); b.type = 'button'; b.className = 'chip'; b.innerHTML = html;
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); if (dis) b.disabled = true; return b;
  }
  function drawSlots() {
    slotWrap.innerHTML = '';
    SLOTS.forEach(function (s, idx) {
      var past = st.day != null && days[st.day].today && now.getHours() >= s[2] - 1;
      if (past && st.slot === idx) st.slot = null;
      var b = chip(s[1], st.slot === idx, past);
      b.addEventListener('click', function () { st.slot = idx; drawSlots(); });
      slotWrap.appendChild(b);
    });
  }
  days.forEach(function (dy, idx) {
    var b = chip(dy.label + '<small>' + dy.date + '</small>', false);
    b.addEventListener('click', function () {
      st.day = idx;
      Array.prototype.forEach.call(dayWrap.children, function (c, j) { c.setAttribute('aria-pressed', j === idx ? 'true' : 'false'); });
      drawSlots();
    });
    dayWrap.appendChild(b);
  });
  drawSlots();

  var box = $('#demo-box'), openBtn = $('#demo-open');
  openBtn.addEventListener('click', function () {
    var open = !box.classList.contains('open');
    box.classList.toggle('open', open);
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) dl({ event: 'demo_open', order_no: orderNo });
  });

  $('#d-book').addEventListener('click', function () {
    if (st.sent) return;
    var err = $('#d-err'); err.hidden = true;
    if (st.day == null || st.slot == null) { err.textContent = 'Din aur time dono chuno.'; err.hidden = false; return; }
    var dy = days[st.day], sl = SLOTS[st.slot];
    var when = dy.label + ' (' + dy.date + '), ' + sl[1];
    var phone = /^[6-9]\d{9}$/.test(o.phone || '') ? o.phone : '';
    var iso = dy.dt.getFullYear() + '-' + String(dy.dt.getMonth() + 1).padStart(2, '0') + '-' + String(dy.dt.getDate()).padStart(2, '0');
    st.sent = true;
    var btn = $('#d-book'); btn.textContent = 'Book ho raha hai…'; btn.setAttribute('aria-busy', 'true');
    function confirmed(ok) {
      btn.hidden = true;
      var done = $('#d-done');
      done.textContent = ok
        ? '✅ Demo book ho gaya: ' + when + '. Hamari team isi time pe call karegi' + (phone ? ' (+91 ' + phone.slice(0, 5) + ' ' + phone.slice(5) + ')' : '') + '.'
        : 'Booking save nahi hui — WhatsApp pe "' + when + '" bhej dijiye, hum confirm kar denge.';
      done.hidden = false;
      $('#go-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText + ' Demo time: ' + when + '.');
    }
    if (!phone) { confirmed(false); return; }
    fetch(LEADS_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', keepalive: true,
      body: JSON.stringify({
        phone: phone, name: o.name || '', email: '', source: 'combo_demo', couponCode: '',
        message: (isTrial ? 'DEMO for 7-day trial · Request ' : 'DEMO after purchase · Order ') + (orderNo || '?') + ' · ' + when,
        orderNo: orderNo, demoDate: iso, demoDay: dy.label, demoSlot: sl[1]
      })
    }).then(function (r) { return r.ok; }).catch(function () { return false; }).then(function (ok) {
      confirmed(ok);
      if (ok) {
        dl({ event: 'book_demo', order_no: orderNo, demo_date: iso, demo_slot: sl[0] });
        try { window.fbq && window.fbq('track', 'Schedule', { content_name: 'combo_demo' }); } catch (e) {}
      }
    });
  });
})();
