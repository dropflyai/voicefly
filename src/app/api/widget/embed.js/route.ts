/**
 * Widget Embed Script
 *
 * Serves the JavaScript snippet that businesses paste into their website.
 * The script creates a floating button + iframe that loads the full chat UI.
 *
 * Usage: <script src="https://app.voicefly.ai/api/widget/embed.js?token=TOKEN"></script>
 *
 * GET /api/widget/embed.js?token=TOKEN
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('// Missing widget token', {
      status: 400,
      headers: { 'Content-Type': 'application/javascript' },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.voicefly.ai'
  const configUrl = `${appUrl}/api/widget/config/${token}`
  const widgetUrl = `${appUrl}/widget/${token}`

  // The embed script is intentionally self-contained — no external deps.
  // It fetches config first so it can position + color the button before
  // showing the iframe.
  const script = `
(function() {
  'use strict';

  var WIDGET_URL = '${widgetUrl}';
  var CONFIG_URL = '${configUrl}';
  var STORAGE_KEY = 'vf_widget_open_${token.substring(0, 8)}';

  if (window.__voiceflyWidget) return; // prevent double-init
  window.__voiceflyWidget = true;

  var config = {
    primaryColor: '#6366f1',
    position: 'bottom-right',
    autoPopDelay: 0,
    showOnMobile: true,
  };
  var isOpen = false;
  var iframe = null;
  var button = null;
  var container = null;

  function isMobile() {
    return window.innerWidth < 768;
  }

  function getPositionStyles(position) {
    var base = 'position:fixed;z-index:2147483647;';
    var map = {
      'bottom-right': 'bottom:24px;right:24px;',
      'bottom-left':  'bottom:24px;left:24px;',
      'top-right':    'top:24px;right:24px;',
      'top-left':     'top:24px;left:24px;',
    };
    return base + (map[position] || map['bottom-right']);
  }

  function createButton(color, position) {
    var btn = document.createElement('button');
    btn.id = '__vf_widget_btn';
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.cssText = [
      getPositionStyles(position),
      'width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;',
      'background:' + color + ';',
      'box-shadow:0 4px 12px rgba(0,0,0,0.25);',
      'display:flex;align-items:center;justify-content:center;',
      'transition:transform 0.15s,box-shadow 0.15s;',
    ].join('');

    // Chat bubble SVG icon
    btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white"/></svg>';

    btn.addEventListener('mouseover', function() {
      btn.style.transform = 'scale(1.07)';
      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
    });
    btn.addEventListener('mouseout', function() {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    });
    btn.addEventListener('click', toggleWidget);
    return btn;
  }

  function createIframe(position) {
    var wrap = document.createElement('div');
    var isRight = position.indexOf('right') !== -1;
    var isBottom = position.indexOf('bottom') !== -1;
    wrap.id = '__vf_widget_frame';
    wrap.style.cssText = [
      getPositionStyles(position),
      'width:380px;height:600px;',
      'max-width:calc(100vw - 32px);max-height:calc(100vh - 100px);',
      isRight ? 'right:0;' : 'left:0;',
      isBottom ? 'bottom:88px;' : 'top:88px;',
      'border-radius:16px;overflow:hidden;',
      'box-shadow:0 8px 32px rgba(0,0,0,0.18);',
      'opacity:0;transform:translateY(12px) scale(0.97);',
      'transition:opacity 0.2s,transform 0.2s;pointer-events:none;',
    ].join('');

    var frame = document.createElement('iframe');
    frame.src = WIDGET_URL;
    frame.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    frame.setAttribute('title', 'Chat widget');
    frame.setAttribute('allow', 'microphone');

    wrap.appendChild(frame);
    iframe = wrap;
    return wrap;
  }

  function openWidget() {
    if (!iframe) return;
    isOpen = true;
    iframe.style.opacity = '1';
    iframe.style.transform = 'translateY(0) scale(1)';
    iframe.style.pointerEvents = 'auto';
    button.setAttribute('aria-label', 'Close chat');
    button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>';
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
  }

  function closeWidget() {
    if (!iframe) return;
    isOpen = false;
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(12px) scale(0.97)';
    iframe.style.pointerEvents = 'none';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white"/></svg>';
    try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
  }

  function toggleWidget() {
    if (isOpen) { closeWidget(); } else { openWidget(); }
  }

  // Listen for close messages from the iframe (validate origin)
  window.addEventListener('message', function(e) {
    var widgetOrigin = new URL(WIDGET_URL).origin;
    if (e.origin !== widgetOrigin) return;
    if (e.data && e.data.type === 'vf_widget_close') closeWidget();
  });

  function init(cfg) {
    if (isMobile() && !cfg.showOnMobile) return;

    config = Object.assign(config, cfg);
    var position = config.position || 'bottom-right';

    container = document.createElement('div');
    container.id = '__vf_widget_root';

    button = createButton(config.primaryColor, position);
    var frame = createIframe(position);

    container.appendChild(frame);
    container.appendChild(button);
    document.body.appendChild(container);

    // Auto-pop if configured
    if (config.autoPopDelay > 0) {
      setTimeout(function() {
        var wasOpen = false;
        try { wasOpen = !!sessionStorage.getItem(STORAGE_KEY); } catch(e) {}
        if (!wasOpen) openWidget();
      }, config.autoPopDelay * 1000);
    }
  }

  // Fetch config then initialize
  fetch(CONFIG_URL)
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (data && data.config) {
        init(data.config);
      }
    })
    .catch(function() {
      // Fallback with defaults if config fetch fails
      init(config);
    });
})();
`.trim()

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // 5-minute cache
    },
  })
}
