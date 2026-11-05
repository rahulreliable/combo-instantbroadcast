// Hero demo video (YouTube "Instant Broadcast Portal Demo").
// Markup: <div class="ibv" data-yt="XL-ovqkwRTA"> … <button class="ibv-btn"> … </button></div>
// Shows a local thumbnail first (fast page load, no YouTube request), and swaps in the YouTube
// player only when the visitor taps play. Tracks video_play in GTM and ViewContent on Meta.
(function () {
  'use strict';
  var d = document;
  var css = d.createElement('style');
  css.textContent =
    '.ibv{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#0F2A22;' +
      'box-shadow:0 24px 50px -22px rgba(6,35,26,.55),0 0 0 1px rgba(6,35,26,.08)}' +
    '.ibv iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    '.ibv-btn{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;margin:0;background:none;cursor:pointer;display:block}' +
    '.ibv-btn img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ibv-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,35,26,0) 55%,rgba(6,35,26,.55) 100%)}' +
    '.ibv-play{position:absolute;left:50%;top:50%;z-index:2;width:78px;height:78px;margin:-39px 0 0 -39px;border-radius:50%;' +
      'background:#00A67E;display:grid;place-items:center;box-shadow:0 10px 28px rgba(0,60,45,.45);transition:transform .2s;' +
      'animation:ibv-pulse 2.2s ease-out infinite}' +
    '.ibv-play svg{width:30px;height:30px;margin-left:5px;color:#fff}' +
    '.ibv-btn:hover .ibv-play{transform:scale(1.08)}' +
    '.ibv-btn:focus-visible{outline:3px solid #8FD9BD;outline-offset:-3px}' +
    '.ibv-cap{position:absolute;left:12px;bottom:12px;z-index:2;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.95);' +
      'color:#0F2A22;font:700 13px/1 Inter,system-ui,sans-serif;padding:8px 12px;border-radius:999px}' +
    '.ibv-cap i{width:8px;height:8px;border-radius:50%;background:#E5484D;display:inline-block}' +
    '@keyframes ibv-pulse{0%{box-shadow:0 0 0 0 rgba(0,166,126,.55),0 10px 28px rgba(0,60,45,.45)}' +
      '80%,100%{box-shadow:0 0 0 22px rgba(0,166,126,0),0 10px 28px rgba(0,60,45,.45)}}' +
    '@media(max-width:480px){.ibv{border-radius:14px}.ibv-play{width:64px;height:64px;margin:-32px 0 0 -32px}.ibv-play svg{width:24px;height:24px}}' +
    '@media(prefers-reduced-motion:reduce){.ibv-play{animation:none}}';
  d.head.appendChild(css);

  function play(box, via) {
    if (box.getAttribute('data-playing')) return;
    box.setAttribute('data-playing', '1');
    // don't interrupt the video with the timed popup
    try { sessionStorage.setItem('ib_auto_popup', '1'); } catch (e) {}
    var id = box.getAttribute('data-yt');
    var f = d.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.title = 'Instant Broadcast Portal Demo';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    box.innerHTML = '';
    box.appendChild(f);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'video_play', video_id: id, video_title: 'Instant Broadcast Portal Demo', via: via || 'hero' });
    try { window.fbq && window.fbq('track', 'ViewContent', { content_name: 'portal_demo_video', content_type: 'video' }); } catch (e) {}
  }
  // One listener for the whole page, so it also works for heroes rendered after this script runs
  d.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.ibv-btn') : null;
    if (!btn) return;
    var box = btn.closest('.ibv[data-yt]');
    if (box) { e.preventDefault(); play(box, 'hero'); }
  });
})();
