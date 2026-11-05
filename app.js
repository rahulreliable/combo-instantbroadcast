// Instant Broadcast — Combo page (7-day FREE trial): product ticks, trial popup, videos, sticky bar, timed popup.
// No prices on this page. The popup saves the lead and opens /thank-you/ with a unique request number.
// (worker.js still has the Razorpay order/verify API; it is not used while the page runs the free trial.)
(function () {
  'use strict';

  var CONFIG = {
    items: {
      portal:     { name: 'Instant Broadcast portal (web + app)' },
      ai_chatbot: { name: 'AI Chatbot (24x7)' },
      ai_calling: { name: 'AI Calling agent' }
    },
    leadsApi: 'https://instantbroadcast.in/api/leads/special-offer',
    capiApi: 'https://instantbroadcast.in/api/tracking/meta-capi',
    source: 'combo_trial',
    waNumber: '919228173004',
    autoPopupMs: 4000
  };

  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var dl = function (o) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(o); };
  var fb = function () { try { window.fbq && window.fbq.apply(null, arguments); } catch (e) {} };
  function ss(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function sg(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function utm() { try { return JSON.parse(sessionStorage.getItem('ib_utm') || '{}') || {}; } catch (e) { return {}; } }

  // ── which products the visitor wants to try ──
  var selected = {}; // addon id -> true
  function names() {
    return ['Portal'].concat(Object.keys(selected).map(function (id) { return id === 'ai_chatbot' ? 'AI Chatbot' : 'AI Calling'; }));
  }
  function syncPicks() {
    $$('#co-picks .pick[data-id]').forEach(function (p) {
      var on = !!selected[p.getAttribute('data-id')];
      p.classList.toggle('on', on); $('input', p).checked = on;
    });
  }
  function render() {
    var lines = $('#cart-lines');
    if (lines) {
      lines.innerHTML = '';
      var add = function (label, val) {
        var li = d.createElement('li');
        var a = d.createElement('span'); a.textContent = label;
        var b = d.createElement('span'); b.textContent = val; b.className = 'free';
        li.appendChild(a); li.appendChild(b); lines.appendChild(li);
      };
      add(CONFIG.items.portal.name, '7 din FREE');
      ['ai_chatbot', 'ai_calling'].forEach(function (id) { if (selected[id]) add(CONFIG.items[id].name, '7 din FREE'); });
    }
    var si = $('#s-items'); if (si) si.textContent = names().join(' + ');
    syncPicks();
  }
  function setAddon(id, on, via) {
    var label = $('.item[data-id="' + id + '"]');
    if (!label) return;
    $('input', label).checked = on;
    label.classList.toggle('on', on);
    if (on) selected[id] = true; else delete selected[id];
    render();
    if (on) dl({ event: 'select_item', item_id: id, via: via || 'tick', lead_source: CONFIG.source });
  }
  $$('.item input[name="addon"]').forEach(function (box) {
    box.addEventListener('change', function () { setAddon(box.value, box.checked, 'tick'); });
  });
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

  // ── sticky bar: shows after the hero, hides while the product list is on screen ──
  var sticky = $('#sticky'), hero = $('.hero'), cart = $('.cart');
  var heroGone = false, cartVisible = false;
  function upd() { var show = heroGone && !cartVisible; sticky.classList.toggle('show', show); sticky.setAttribute('aria-hidden', show ? 'false' : 'true'); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; upd(); }, { rootMargin: '-200px 0px 0px 0px' }).observe(hero);
    if (cart) new IntersectionObserver(function (e) { cartVisible = e[0].isIntersecting; upd(); }).observe(cart);
  }

  // ── trial popup ──
  var co = $('#co'), back = $('#co-back'), lastFocus = null, popupUsed = false;
  function openCo(via) {
    popupUsed = true;
    syncPicks();
    lastFocus = d.activeElement;
    co.hidden = false;
    requestAnimationFrame(function () { co.classList.add('open'); back.classList.add('open'); });
    d.body.style.overflow = 'hidden';
    if (via !== 'auto_4s') setTimeout(function () { $('#co-name').focus(); }, 60);
    dl({ event: 'popup_open', popup_source: via, lead_source: CONFIG.source });
  }
  function closeCo() {
    co.classList.remove('open'); back.classList.remove('open');
    d.body.style.overflow = '';
    setTimeout(function () { co.hidden = true; }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-checkout]').forEach(function (b) { b.addEventListener('click', function () { openCo(b.getAttribute('data-checkout')); }); });
  $$('#co-picks input').forEach(function (box) {
    box.addEventListener('change', function () { setAddon(box.value, box.checked, 'popup_tick'); });
  });
  $$('a[href="#combo"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      openCo(a.getAttribute('data-cta') || a.getAttribute('data-add') || 'cta');
    });
  });
  $('#co-x').addEventListener('click', closeCo);
  back.addEventListener('click', closeCo);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && co.classList.contains('open')) closeCo(); });

  // Timed popup: 4 s after the page opens, once per visit (not if already opened or while typing).
  setTimeout(function () {
    var ae = d.activeElement;
    if (sg('ib_auto_popup') === '1' || popupUsed || (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) return;
    ss('ib_auto_popup', '1');
    openCo('auto_4s');
  }, CONFIG.autoPopupMs);

  var phoneIn = $('#co-phone');
  phoneIn.addEventListener('input', function () { phoneIn.value = phoneIn.value.replace(/[^\d ]/g, ''); });

  // Unique, readable request number: IB-YYMMDD-XXXXX (no 0/O/1/I)
  function requestNo() {
    var now = new Date(Date.now() + 5.5 * 3600 * 1000);
    var ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = '';
    var bytes = new Uint8Array(5);
    try { crypto.getRandomValues(bytes); } catch (e) { for (var i = 0; i < 5; i++) bytes[i] = Math.floor(Math.random() * 256); }
    for (var j = 0; j < 5; j++) code += abc[bytes[j] % abc.length];
    return 'IB-' + ymd + '-' + code;
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

    var addons = Object.keys(selected);
    var reqNo = requestNo();
    var u = utm();
    var items = [CONFIG.items.portal.name].concat(addons.map(function (id) { return CONFIG.items[id].name; }));
    var summary = '7 DIN FREE TRIAL request ' + reqNo + ' · Try karna hai: ' + items.join(' + ') +
      (biz ? ' · Business: ' + biz : '') + (u.utm_campaign ? ' · Campaign: ' + u.utm_campaign : '');
    var full = {
      phone: phone, name: name + ' | 7 din FREE trial', email: '', source: CONFIG.source, couponCode: '',
      message: summary, description: summary, company: biz, addons: addons.join(','), orderNo: reqNo,
      pageUrl: location.href.split('#')[0],
      utm_source: u.utm_source || '', utm_medium: u.utm_medium || '', utm_campaign: u.utm_campaign || '',
      utm_content: u.utm_content || '', utm_term: u.utm_term || '', fbclid: u.fbclid || '', gclid: u.gclid || ''
    };
    var minimal = { phone: phone, name: name + ' | 7 din FREE trial', email: '', source: CONFIG.source, couponCode: '' };

    sending = true;
    var btn = $('#co-submit'); btn.setAttribute('aria-busy', 'true'); $('.lbl', btn).textContent = 'Ek second…';

    // Lead counted once: browser pixel + server copy (same event id, so Meta de-duplicates)
    fb('track', 'Lead', { content_name: 'combo_trial' }, { eventID: reqNo });
    dl({ event: 'generate_lead', lead_source: CONFIG.source, form_name: 'combo_trial' });
    try {
      fetch(CONFIG.capiApi, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'omit',
        body: JSON.stringify({ eventName: 'Lead', eventId: reqNo, customData: { content_name: 'combo_trial' }, userData: { phone: '+91' + phone }, eventSourceUrl: location.href })
      }).catch(function () {});
    } catch (x) {}

    ss('ib_order', JSON.stringify({ kind: 'trial', orderNo: reqNo, items: items, name: name, phone: phone, addons: addons }));
    var done = false;
    function go() { if (done) return; done = true; location.href = '/thank-you/?order=' + encodeURIComponent(reqNo); }
    function post(body) {
      return fetch(CONFIG.leadsApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true, credentials: 'omit' });
    }
    setTimeout(go, 4000); // slow network: carry on, the keepalive request keeps running
    post(full).then(function (r) {
      if (r.ok) return r.json().then(function (j) { return !(j && j.success === false); }, function () { return true; });
      return false;
    }).then(function (ok) {
      if (ok) return setTimeout(go, 300);
      return post(minimal).then(go, go);
    }).catch(function () {
      if (done) return;
      sending = false; btn.removeAttribute('aria-busy'); $('.lbl', btn).textContent = '7 din FREE trial shuru karo';
      err.textContent = '';
      err.appendChild(d.createTextNode('Connection nahi ho paya. Dobara try karo, ya '));
      var a = d.createElement('a');
      a.href = 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent('Hi, mujhe Instant Broadcast ka 7 din FREE trial chahiye. Naam: ' + name + '. Try karna hai: ' + names().join(' + ') + ' [combo-lp]');
      a.textContent = 'WhatsApp pe trial maango';
      err.appendChild(a); err.appendChild(d.createTextNode('.'));
      err.hidden = false;
    });
  });
})();
