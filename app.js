// Instant Broadcast — Combo page: combo builder (tick to add), cart, checkout, videos, sticky bar.
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // CONFIG — edit prices and the checkout link here only.
  // Add-on price: set a yearly number in ₹ (before GST), e.g. 6000.
  // While a price is null the add-on shows "Price team confirm karegi"
  // and is not counted in the total (it is still sent with the order).
  // ─────────────────────────────────────────────────────────────
  var CONFIG = {
    gstRate: 0.18,
    items: {
      portal:     { name: 'Instant Broadcast portal (web + app)', price: 15000 },
      ai_chatbot: { name: 'AI Chatbot (24x7)',                    price: null },
      ai_calling: { name: 'AI Calling agent',                     price: null },
      kit:        { name: 'WhatsApp Showroom Kit',                price: 0, free: true }
    },
    // Razorpay: orders are created and verified by worker.js (keep its PRICES in step with these).
    orderApi: '/api/order',
    verifyApi: '/api/verify',
    leadsApi: 'https://instantbroadcast.in/api/leads/special-offer',
    capiApi: 'https://instantbroadcast.in/api/tracking/meta-capi',
    source: 'combo_landing',
    waNumber: '919228173004'
  };

  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var dl = function (o) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(o); };
  var fb = function () { try { window.fbq && window.fbq.apply(null, arguments); } catch (e) {} };
  function ss(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function utm() { try { return JSON.parse(sessionStorage.getItem('ib_utm') || '{}') || {}; } catch (e) { return {}; } }

  // ── cart state ──
  var selected = {}; // addon id -> true

  function priceLabel(id) {
    var it = CONFIG.items[id];
    return it.price == null ? 'Price team confirm karegi' : inr(it.price) + ' / saal + GST';
  }
  $$('[data-price-label]').forEach(function (el) {
    var id = el.getAttribute('data-price-label');
    var it = CONFIG.items[id];
    if (it.price == null) { el.innerHTML = '<small style="font-weight:600;color:var(--muted)">' + priceLabel(id) + '</small>'; }
    else { el.innerHTML = inr(it.price) + ' <small>/ saal + GST</small>'; }
  });

  function totals() {
    var sub = CONFIG.items.portal.price, tbc = [];
    Object.keys(selected).forEach(function (id) {
      var p = CONFIG.items[id].price;
      if (p == null) tbc.push(CONFIG.items[id].name); else sub += p;
    });
    var gst = sub * CONFIG.gstRate;
    return { sub: sub, gst: gst, total: sub + gst, tbc: tbc };
  }

  function render() {
    var t = totals();
    var lines = $('#cart-lines');
    lines.innerHTML = '';
    function line(label, val, cls) {
      var li = d.createElement('li');
      var a = d.createElement('span'); a.textContent = label;
      var b = d.createElement('span'); b.textContent = val; if (cls) b.className = cls;
      li.appendChild(a); li.appendChild(b); lines.appendChild(li);
    }
    line(CONFIG.items.portal.name, inr(CONFIG.items.portal.price));
    ['ai_chatbot', 'ai_calling'].forEach(function (id) {
      if (!selected[id]) return;
      var p = CONFIG.items[id].price;
      line(CONFIG.items[id].name, p == null ? 'Price on call' : inr(p), p == null ? 'tbc' : '');
    });
    line(CONFIG.items.kit.name, 'FREE', 'free');
    $('#c-sub').textContent = inr(t.sub);
    $('#c-gst').textContent = inr(t.gst);
    $('#c-total').textContent = inr(t.total);
    $('#c-fine').textContent = t.tbc.length
      ? t.tbc.join(' aur ') + ' ka price checkout ke baad hamari team confirm karegi — abhi total mein nahi joda.'
      : 'Total mein 18% GST shamil hai. Billing saal mein ek baar.';
    var names = ['Portal'].concat(Object.keys(selected).map(function (id) { return id === 'ai_chatbot' ? 'AI Chatbot' : 'AI Calling'; }));
    $('#s-items').textContent = names.join(' + ') + ' + Free kit';
    $('#s-total').textContent = inr(t.total) + ' / saal' + (t.tbc.length ? ' + add-on' : '');
  }

  function setAddon(id, on, via) {
    var label = $('.item[data-id="' + id + '"]');
    if (!label) return;
    var box = $('input', label);
    box.checked = on;
    label.classList.toggle('on', on);
    if (on) selected[id] = true; else delete selected[id];
    render();
    if (on) {
      var p = CONFIG.items[id].price;
      fb('track', 'AddToCart', { content_ids: [id], content_name: CONFIG.items[id].name, content_type: 'product', currency: 'INR', value: p || 0 });
      dl({ event: 'add_to_cart', item_id: id, via: via || 'tick', lead_source: CONFIG.source });
    }
  }

  $$('.item input[name="addon"]').forEach(function (box) {
    box.addEventListener('change', function () { setAddon(box.value, box.checked, 'tick'); });
  });
  // "AI Chatbot add karo" / "AI Calling add karo" buttons in the feature sections
  $$('[data-add]').forEach(function (a) {
    a.addEventListener('click', function () { setAddon(a.getAttribute('data-add'), true, 'section_button'); });
  });
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () { dl({ event: 'cta_click', cta: a.getAttribute('data-cta'), lead_source: CONFIG.source }); });
  });
  render();

  // ── video stories (real customer videos from instantbroadcast.in) ──
  var VIDEOS = [
    ['manibhadra-silk', 'Manibhadra Silk Fabric', 'Mitesh Bhandari', 'https://www.instagram.com/reel/DbbVnfdI-eq/'],
    ['d-wholesale', 'D Wholesale', 'Asif Khan', 'https://www.instagram.com/reel/DeB42OcIxLY/'],
    ['shree-laxmi', 'Shree Laxmi & Co', 'Harshit Junjunwala', 'https://www.instagram.com/reel/DdT0Uc7IW0m/'],
    ['jso-creation', 'Jso Creation', 'Surya Baheti', 'https://www.instagram.com/reel/DdROoDDoWtO/'],
    ['damodaram', 'Damodaram', 'Divyesh Kuberwala', 'https://youtube.com/shorts/6DUUqmkQTOs'],
    ['pc-bangles', 'PC Bangles', 'Nainesh Zinzuwadiya', 'https://youtube.com/shorts/gwwaA-ACkVA'],
    ['glenn-automotive', 'Glenn Automotive', 'Nainesh Zinzuwadiya', 'https://www.instagram.com/reel/DdYyOHzoRLG/'],
    ['nityas-jewel', 'Nityas Jewel', 'Rajnikant Chanchad', 'https://www.instagram.com/reel/Dbta-Zlox6p/'],
    ['sanepara', 'Sanepara & Co', 'Vaibhav Sanepara', 'https://youtube.com/shorts/bEZ-Z7enIW4'],
    ['manmay-creation', 'Manmay Creation', 'Paritosh Kedia', 'https://instantbroadcast.in/media/aFR0tddvk5g81iBPgIyJ8R4XRIoEkTuR.mp4'],
    ['legit-pathlab', 'Legit Pathlab', 'Komal Bambal', 'https://www.instagram.com/reel/Db6NEqMK-NK/'],
    ['satguru-clinic', 'Satguru Clinic', 'Avinash Vegad', 'https://www.instagram.com/reel/DboASJnotV4/'],
    ['bsos-store', 'Bsos Store', 'Hiiren Jogiya', 'https://www.instagram.com/reel/DbieMZ5Ikd1/'],
    ['ziva', 'Ziva a Concept Store', 'Rashi', 'https://www.instagram.com/reel/DbqoYnqoKgM/'],
    ['keshamrit', 'Keshamrit', 'Anjali', 'https://instantbroadcast.in/media/GLGQA2D4Ma59VrBAZRQ3V2Fqa63MBXrO.mp4'],
    ['rokan-ni-vato', 'Rokan Ni Vato', 'Rahul Kikani', 'https://www.instagram.com/reel/DdoUrXxoM5y/'],
    ['staybiz', 'Staybiz Academy', 'Jaideep Parmar', 'https://youtube.com/shorts/BK-w8D83blw'],
    ['surat-jugaad', 'Surat Jugaad', 'Mayank Jindal', 'https://youtube.com/shorts/e1mR9TpF5yQ']
  ];
  var vr = $('#videos');
  if (vr) VIDEOS.forEach(function (v) {
    var a = d.createElement('a');
    a.className = 'vid'; a.href = v[3]; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<div class="th"><img loading="lazy" decoding="async" width="284" height="380" alt=""><span class="play"><svg><use href="#i-play"/></svg></span></div><b></b><small></small>';
    $('img', a).src = '/assets/review-' + v[0] + '.webp';
    $('img', a).alt = v[1] + ' video review';
    $('b', a).textContent = v[1];
    $('small', a).textContent = v[2] + ' · ★★★★★';
    a.addEventListener('click', function () { dl({ event: 'video_review_click', video: v[0], lead_source: CONFIG.source }); });
    vr.appendChild(a);
  });

  // ── sticky bar: shows after the hero, hides while the cart is on screen ──
  var sticky = $('#sticky'), hero = $('.hero'), cart = $('.cart');
  var heroGone = false, cartVisible = false;
  function upd() { var show = heroGone && !cartVisible; sticky.classList.toggle('show', show); sticky.setAttribute('aria-hidden', show ? 'false' : 'true'); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; upd(); }, { rootMargin: '-200px 0px 0px 0px' }).observe(hero);
    new IntersectionObserver(function (e) { cartVisible = e[0].isIntersecting; upd(); }).observe(cart);
  }

  // ── checkout drawer ──
  var co = $('#co'), back = $('#co-back'), lastFocus = null;
  function openCo(via) {
    var t = totals();
    var mini = $('#co-mini');
    var names = ['Portal'].concat(Object.keys(selected).map(function (id) { return CONFIG.items[id].name; })).concat(['Showroom Kit (free)']);
    mini.textContent = '';
    var b = d.createElement('b'); b.textContent = inr(t.total) + ' / saal';
    mini.appendChild(d.createTextNode(names.join(' + ') + ' — '));
    mini.appendChild(b);
    mini.appendChild(d.createTextNode(' (GST ke saath)' + (t.tbc.length ? '. ' + t.tbc.join(' aur ') + ' ka price team confirm karegi.' : '.')));
    lastFocus = d.activeElement;
    co.hidden = false;
    requestAnimationFrame(function () { co.classList.add('open'); back.classList.add('open'); });
    d.body.style.overflow = 'hidden';
    setTimeout(function () { $('#co-name').focus(); }, 60);
    var ids = ['portal'].concat(Object.keys(selected));
    fb('track', 'InitiateCheckout', { content_ids: ids, num_items: ids.length, currency: 'INR', value: Math.round(t.total) });
    dl({ event: 'begin_checkout', currency: 'INR', value: Math.round(t.total), items: ids.join(','), via: via, lead_source: CONFIG.source });
  }
  function closeCo() {
    co.classList.remove('open'); back.classList.remove('open');
    d.body.style.overflow = '';
    setTimeout(function () { co.hidden = true; }, 250);
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-checkout]').forEach(function (b) { b.addEventListener('click', function () { openCo(b.getAttribute('data-checkout')); }); });
  $('#co-x').addEventListener('click', closeCo);
  back.addEventListener('click', closeCo);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && co.classList.contains('open')) closeCo(); });

  var phoneIn = $('#co-phone');
  phoneIn.addEventListener('input', function () { phoneIn.value = phoneIn.value.replace(/[^\d ]/g, ''); });

  // Razorpay Checkout script, loaded only when someone pays
  var rzpLoading = null;
  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    if (rzpLoading) return rzpLoading;
    rzpLoading = new Promise(function (resolve) {
      var sc = d.createElement('script');
      sc.src = 'https://checkout.razorpay.com/v1/checkout.js';
      sc.onload = resolve; sc.onerror = function () { rzpLoading = null; resolve(); };
      d.head.appendChild(sc);
    });
    return rzpLoading;
  }

  var sending = false;
  $('#co-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var err = $('#co-err');
    var name = $('#co-name').value.trim().replace(/\s+/g, ' ');
    var phone = phoneIn.value.replace(/\D/g, '');
    if (phone.length === 12 && phone.indexOf('91') === 0) phone = phone.slice(2);
    if (phone.length === 11 && phone[0] === '0') phone = phone.slice(1);
    var biz = $('#co-biz').value.trim();
    err.hidden = true;
    if (name.length < 2) { err.textContent = 'Apna naam likho.'; err.hidden = false; $('#co-name').focus(); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { err.textContent = 'Sahi 10 digit WhatsApp number daalo.'; err.hidden = false; phoneIn.focus(); return; }

    var t = totals();
    var addons = Object.keys(selected);
    var eventId = 'combo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    var u = utm();
    var summary = 'Combo page checkout. Items: Portal (₹15,000/yr)' +
      addons.map(function (id) { return ' + ' + CONFIG.items[id].name + (CONFIG.items[id].price == null ? ' (price TBC)' : ' (' + inr(CONFIG.items[id].price) + ')'); }).join('') +
      ' + Showroom Kit (free). Total shown: ' + inr(t.total) + ' incl. GST.' + (biz ? ' Business: ' + biz + '.' : '') +
      (u.utm_campaign ? ' Campaign: ' + u.utm_campaign : '');
    var full = {
      phone: phone, name: name, email: '', source: CONFIG.source, couponCode: '',
      message: summary, company: biz, addons: addons.join(','), cartTotal: Math.round(t.total),
      pageUrl: location.href.split('#')[0],
      utm_source: u.utm_source || '', utm_medium: u.utm_medium || '', utm_campaign: u.utm_campaign || '',
      utm_content: u.utm_content || '', utm_term: u.utm_term || '', fbclid: u.fbclid || '', gclid: u.gclid || ''
    };
    var minimal = { phone: phone, name: name, email: '', source: CONFIG.source, couponCode: '' };

    sending = true;
    var btn = $('#co-submit'); btn.setAttribute('aria-busy', 'true'); $('.lbl', btn).textContent = 'Ek second…';
    // warm up Razorpay while we save the lead
    loadRazorpay();
    ss('ib_combo_event_id', eventId);

    // Lead counted once: browser pixel + server copy (same event id → Meta de-duplicates)
    fb('track', 'Lead', { content_name: 'combo_checkout', currency: 'INR', value: Math.round(t.total) }, { eventID: eventId });
    dl({ event: 'generate_lead', lead_source: CONFIG.source, form_name: 'combo_checkout', value: Math.round(t.total), currency: 'INR' });
    try {
      fetch(CONFIG.capiApi, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'omit',
        body: JSON.stringify({ eventName: 'Lead', eventId: eventId, customData: { content_name: 'combo_checkout', currency: 'INR', value: Math.round(t.total) }, userData: { phone: '+91' + phone }, eventSourceUrl: location.href })
      }).catch(function () {});
    } catch (x) {}

    // Save the lead first (fire-and-forget) so the team can follow up even if payment is abandoned
    function post(body) {
      return fetch(CONFIG.leadsApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true, credentials: 'omit' });
    }
    post(full).then(function (r) {
      if (r.ok) return r.json().then(function (j) { return !(j && j.success === false); }, function () { return true; });
      return false;
    }).then(function (ok) { if (!ok) return post(minimal); }).catch(function () {});

    function reset(label) { sending = false; btn.removeAttribute('aria-busy'); $('.lbl', btn).textContent = label || 'Payment karo'; }
    function showErr(msg) {
      err.textContent = '';
      err.appendChild(d.createTextNode(msg + ' '));
      var a = d.createElement('a');
      a.href = 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent('Hi, mujhe Instant Broadcast combo lena hai. Naam: ' + name + '. Items: Portal' + addons.map(function (id) { return ' + ' + CONFIG.items[id].name; }).join('') + ' [combo-lp]');
      a.textContent = 'WhatsApp pe order karo';
      err.appendChild(a); err.appendChild(d.createTextNode('.'));
      err.hidden = false;
    }

    // 1. Create the Razorpay order on our Worker (amount is decided on the server)
    Promise.all([
      loadRazorpay(),
      fetch(CONFIG.orderApi, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ name: name, phone: phone, business: biz, addons: addons, utm_campaign: u.utm_campaign || '', utm_content: u.utm_content || '' })
      }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
    ]).then(function (res) {
      var o = res[1];
      if (!o || !o.ok || !window.Razorpay) { reset(); showErr('Payment abhi shuru nahi ho paya. Thodi der mein dobara try karo, ya'); return; }
      ss('ib_pending_order', JSON.stringify({ orderNo: o.orderNo, amount: o.amount / 100, items: o.items, name: name, phone: phone }));
      fb('track', 'AddPaymentInfo', { currency: 'INR', value: o.amount / 100 });
      dl({ event: 'add_payment_info', currency: 'INR', value: o.amount / 100, order_no: o.orderNo });

      // 2. Razorpay Checkout
      var rzp = new window.Razorpay({
        key: o.key,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: 'Instant Broadcast',
        description: 'Combo · Order ' + o.orderNo,
        image: location.origin + '/assets/apple-touch-icon.png',
        prefill: { name: name, contact: '+91' + phone },
        notes: { order_no: o.orderNo },
        theme: { color: '#007A5C' },
        modal: {
          confirm_close: true,
          ondismiss: function () { reset(); err.textContent = 'Payment complete nahi hua. Dobara "Payment karo" dabao.'; err.hidden = false; }
        },
        // 3. Verify on our Worker, then go to the thank-you page
        handler: function (resp) {
          $('.lbl', btn).textContent = 'Payment confirm ho raha hai…';
          fetch(CONFIG.verifyApi, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
            body: JSON.stringify(resp)
          }).then(function (r) { return r.json(); }).then(function (v) {
            if (!v || !v.ok) throw new Error('verify');
            ss('ib_order', JSON.stringify({ verified: true, orderNo: v.orderNo, paymentId: v.paymentId, amount: v.amount, items: v.items, name: name, phone: phone, addons: addons }));
            location.href = '/thank-you/?order=' + encodeURIComponent(v.orderNo);
          }).catch(function () {
            // Paid but the check didn't come back: still show the order, the team verifies it in Razorpay
            ss('ib_order', JSON.stringify({ verified: false, orderNo: o.orderNo, paymentId: resp.razorpay_payment_id, amount: o.amount / 100, items: o.items, name: name, phone: phone, addons: addons }));
            location.href = '/thank-you/?order=' + encodeURIComponent(o.orderNo);
          });
        }
      });
      rzp.on('payment.failed', function (r) {
        dl({ event: 'payment_failed', order_no: o.orderNo, reason: (r && r.error && r.error.reason) || '' });
      });
      rzp.open();
      $('.lbl', btn).textContent = 'Razorpay khul raha hai…';
    }).catch(function () { reset(); showErr('Connection nahi ho paya. Dobara try karo, ya'); });
  });
})();
