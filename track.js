// Shared tracking for the combo landing page.
// Same Clarity project, GTM container (GA4 + Google Ads) and visitor tracker as instantbroadcast.in.
(function () {
  'use strict';

  // Microsoft Clarity (yd20prc2yj)
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'yd20prc2yj');

  // Google Tag Manager (GTM-WCGZZNWJ)
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l !== 'dataLayer' ? '&l=' + l : '';
    j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-WCGZZNWJ');

  // Keep the ad-click / UTM parameters of this visit for the lead (first touch in this tab)
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  var params = {};
  try {
    var q = new URLSearchParams(location.search);
    KEYS.forEach(function (k) { var v = q.get(k); if (v) params[k] = v.slice(0, 200); });
    if (Object.keys(params).length && !sessionStorage.getItem('ib_utm')) sessionStorage.setItem('ib_utm', JSON.stringify(params));
    if (!Object.keys(params).length) params = JSON.parse(sessionStorage.getItem('ib_utm') || '{}') || {};
  } catch (e) {}

  // Visit + UTMs to Instant Broadcast's own visitor tracker (the one instantbroadcast.in reports from)
  var vid;
  try {
    vid = localStorage.getItem('ib_visitor_id');
    if (!vid) {
      vid = 'vid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('ib_visitor_id', vid);
    }
  } catch (e) { vid = 'vid_' + Date.now().toString(36); }
  try {
    fetch('https://api.instantbroadcast.in/api/web/utm_track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: vid,
        page_url: location.host + location.pathname + location.search,
        utm_source: params.utm_source, utm_medium: params.utm_medium, utm_campaign: params.utm_campaign,
        utm_content: params.utm_content, utm_term: params.utm_term, gclid: params.gclid, fbclid: params.fbclid,
        is_heartbeat: false
      }),
      keepalive: true,
      credentials: 'omit'
    }).catch(function () {});
  } catch (e) {}

  // WhatsApp and phone taps → GA4 (through GTM) + Meta "Contact"
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me/"], a[href^="tel:"]') : null;
    if (!a) return;
    var isWa = a.href.indexOf('wa.me/') > -1;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: isWa ? 'whatsapp_click' : 'phone_click', link_url: a.href.split('?')[0], lead_source: 'combo_landing' });
    try {
      if (window.fbq) window.fbq('track', 'Contact', { content_name: 'combo_landing', content_category: isWa ? 'whatsapp_cta' : 'phone_cta' });
    } catch (err) {}
  }, true);
})();
