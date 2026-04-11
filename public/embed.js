(function () {
  "use strict";

  var QUIVER_BASE = "https://quivermarkets.com";
  var REFRESH_MS = 60000;

  var COLORS = {
    bg: "#0d1117",
    bgCard: "#161b27",
    border: "#21262d",
    text: "#f0f6fc",
    textMuted: "#8d96a0",
    brand: "#57D7BA",
    positive: "#3fb950",
    negative: "#f85149",
  };

  var STYLES = [
    ".qm-widget{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;background:" + COLORS.bgCard + ";border:1px solid " + COLORS.border + ";border-radius:12px;padding:16px;color:" + COLORS.text + ";max-width:100%;box-sizing:border-box;line-height:1.4;display:block;text-decoration:none;}",
    ".qm-widget *{box-sizing:border-box;}",
    ".qm-widget-light{background:#ffffff;border-color:#e5e7eb;color:#111827;}",
    ".qm-widget-light .qm-muted{color:#6b7280;}",
    ".qm-widget-light .qm-meta{border-color:#e5e7eb;}",
    ".qm-widget-light .qm-arb-card{background:#f9fafb;border-color:#e5e7eb;}",
    ".qm-widget:hover{opacity:.92;}",
    ".qm-header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px;}",
    ".qm-question{font-size:14px;font-weight:600;line-height:1.35;flex:1;}",
    ".qm-category{font-size:9px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:rgba(56,139,253,.15);color:#388bfd;letter-spacing:.05em;flex-shrink:0;}",
    ".qm-price-row{display:flex;align-items:baseline;gap:12px;margin-bottom:8px;}",
    ".qm-price{font-size:28px;font-weight:700;font-family:ui-monospace,SFMono-Regular,monospace;}",
    ".qm-change{font-size:13px;font-weight:600;}",
    ".qm-change-pos{color:" + COLORS.positive + ";}",
    ".qm-change-neg{color:" + COLORS.negative + ";}",
    ".qm-meta{font-size:11px;color:" + COLORS.textMuted + ";display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid " + COLORS.border + ";margin-top:10px;}",
    ".qm-brand{display:flex;align-items:center;gap:4px;color:" + COLORS.brand + ";font-weight:600;}",
    ".qm-arb-cards{display:flex;gap:8px;margin:10px 0;}",
    ".qm-arb-card{flex:1;background:" + COLORS.bg + ";border:1px solid " + COLORS.border + ";border-radius:8px;padding:10px;text-align:center;}",
    ".qm-arb-platform{font-size:9px;font-weight:700;text-transform:uppercase;color:" + COLORS.textMuted + ";margin-bottom:4px;}",
    ".qm-arb-price{font-size:22px;font-weight:700;font-family:ui-monospace,SFMono-Regular,monospace;}",
    ".qm-spread-badge{display:inline-block;background:rgba(87,215,186,.15);color:" + COLORS.brand + ";font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;margin-top:4px;}",
    ".qm-whale-stat{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid " + COLORS.border + ";}",
    ".qm-whale-stat:last-child{border-bottom:none;}",
    ".qm-whale-label{font-size:11px;color:" + COLORS.textMuted + ";}",
    ".qm-whale-value{font-size:13px;font-weight:700;font-family:ui-monospace,SFMono-Regular,monospace;}",
    ".qm-cat-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid " + COLORS.border + ";font-size:12px;}",
    ".qm-cat-row:last-child{border-bottom:none;}",
    ".qm-cat-q{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;}",
    ".qm-cat-price{font-weight:700;font-family:ui-monospace,SFMono-Regular,monospace;color:" + COLORS.brand + ";flex-shrink:0;}",
    ".qm-loading{color:" + COLORS.textMuted + ";font-size:12px;text-align:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
    ".qm-error{color:" + COLORS.textMuted + ";font-size:11px;text-align:center;padding:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
  ].join("");

  function injectStyles() {
    if (document.getElementById("qm-widget-styles")) return;
    var style = document.createElement("style");
    style.id = "qm-widget-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toFixed(0);
  }

  function fmtDollar(n) {
    n = Number(n) || 0;
    var neg = n < 0;
    var abs = Math.abs(n);
    var s;
    if (abs >= 1000000) s = (abs / 1000000).toFixed(1) + "M";
    else if (abs >= 1000) s = (abs / 1000).toFixed(1) + "K";
    else s = abs.toFixed(0);
    return (neg ? "-$" : "$") + s;
  }

  function fetchData(url, cb) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { cb(null, JSON.parse(xhr.responseText)); }
          catch (e) { cb(e, null); }
        } else {
          cb(new Error("HTTP " + xhr.status), null);
        }
      };
      xhr.onerror = function () { cb(new Error("Network error"), null); };
      xhr.send();
    } catch (e) { cb(e, null); }
  }

  function renderError(el) {
    el.innerHTML = '<div class="qm-error"><a href="' + QUIVER_BASE + '" target="_blank" rel="noopener">Powered by Quiver Markets</a></div>';
  }

  function brandFooter() {
    return '<div class="qm-meta"><span class="qm-muted"></span><span class="qm-brand">&#9654; Quiver Markets</span></div>';
  }

  function themeClass(theme) {
    return theme === "light" ? "qm-widget qm-widget-light" : "qm-widget";
  }

  function renderMarket(el, data, theme) {
    var chg = Number(data.change24h) || 0;
    var chgStr = (chg >= 0 ? "+" : "") + chg.toFixed(1) + "pt";
    var chgCls = chg >= 0 ? "qm-change-pos" : "qm-change-neg";
    el.innerHTML = (
      '<a href="' + esc(data.url) + '?utm_source=embed" target="_blank" rel="noopener" class="' + themeClass(theme) + '">' +
        '<div class="qm-header">' +
          '<div class="qm-question">' + esc(data.question) + '</div>' +
          (data.category ? '<span class="qm-category">' + esc(data.category) + '</span>' : '') +
        '</div>' +
        '<div class="qm-price-row">' +
          '<div class="qm-price">' + Math.round(Number(data.price)) + '<span style="font-size:16px;color:' + COLORS.textMuted + '">&#162;</span></div>' +
          '<div class="qm-change ' + chgCls + '">' + chgStr + ' 24h</div>' +
        '</div>' +
        '<div class="qm-meta">' +
          '<span class="qm-muted">Vol $' + fmt(data.volume) + ' &middot; ' + esc(data.platform) + '</span>' +
          '<span class="qm-brand">&#9654; Quiver Markets</span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderArb(el, data, theme) {
    el.innerHTML = (
      '<a href="' + QUIVER_BASE + '/disagrees?utm_source=embed" target="_blank" rel="noopener" class="' + themeClass(theme) + '">' +
        '<div class="qm-header">' +
          '<div class="qm-question">' + esc(data.question) + '</div>' +
          (data.category ? '<span class="qm-category">' + esc(data.category) + '</span>' : '') +
        '</div>' +
        '<div class="qm-arb-cards">' +
          '<div class="qm-arb-card">' +
            '<div class="qm-arb-platform">Polymarket</div>' +
            '<div class="qm-arb-price">' + Math.round(Number(data.polyPrice)) + '<span style="font-size:14px;color:' + COLORS.textMuted + '">&#162;</span></div>' +
          '</div>' +
          '<div class="qm-arb-card">' +
            '<div class="qm-arb-platform">Kalshi</div>' +
            '<div class="qm-arb-price">' + Math.round(Number(data.kalshiPrice)) + '<span style="font-size:14px;color:' + COLORS.textMuted + '">&#162;</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center;margin:8px 0">' +
          '<span class="qm-spread-badge">' + Number(data.spread).toFixed(1) + 'pt arb spread</span>' +
        '</div>' +
        '<div class="qm-meta">' +
          '<span class="qm-muted">Cross-platform arbitrage</span>' +
          '<span class="qm-brand">&#9654; Quiver Markets</span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderWhale(el, data, theme) {
    var pnl = Number(data.totalPnl) || 0;
    var pnlColor = pnl >= 0 ? COLORS.positive : COLORS.negative;
    el.innerHTML = (
      '<a href="' + esc(data.url) + '?utm_source=embed" target="_blank" rel="noopener" class="' + themeClass(theme) + '">' +
        '<div class="qm-header">' +
          '<div class="qm-question">' + esc(data.displayName) + '</div>' +
          '<span class="qm-category">Whale</span>' +
        '</div>' +
        '<div class="qm-whale-stat">' +
          '<span class="qm-whale-label">Total P&amp;L</span>' +
          '<span class="qm-whale-value" style="color:' + pnlColor + '">' + fmtDollar(pnl) + '</span>' +
        '</div>' +
        '<div class="qm-whale-stat">' +
          '<span class="qm-whale-label">Open positions</span>' +
          '<span class="qm-whale-value">' + (Number(data.openPositions) || 0) + '</span>' +
        '</div>' +
        (data.accuracyPct != null ?
          '<div class="qm-whale-stat">' +
            '<span class="qm-whale-label">Accuracy</span>' +
            '<span class="qm-whale-value">' + Number(data.accuracyPct).toFixed(1) + '%</span>' +
          '</div>' : '') +
        '<div class="qm-whale-stat">' +
          '<span class="qm-whale-label">Volume</span>' +
          '<span class="qm-whale-value">$' + fmt(data.volume) + '</span>' +
        '</div>' +
        '<div class="qm-meta">' +
          '<span class="qm-muted">Smart money tracker</span>' +
          '<span class="qm-brand">&#9654; Quiver Markets</span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderCategory(el, data, theme) {
    var rows = (data.markets || []).map(function (m) {
      return (
        '<div class="qm-cat-row">' +
          '<span class="qm-cat-q">' + esc(m.question) + '</span>' +
          '<span class="qm-cat-price">' + Math.round(Number(m.price)) + '&#162;</span>' +
        '</div>'
      );
    }).join("");
    el.innerHTML = (
      '<a href="' + QUIVER_BASE + '/screener?utm_source=embed" target="_blank" rel="noopener" class="' + themeClass(theme) + '">' +
        '<div class="qm-header">' +
          '<div class="qm-question">' + esc(data.category) + ' Markets</div>' +
          '<span class="qm-category">Top 5</span>' +
        '</div>' +
        rows +
        '<div class="qm-meta">' +
          '<span class="qm-muted">By volume</span>' +
          '<span class="qm-brand">&#9654; Quiver Markets</span>' +
        '</div>' +
      '</a>'
    );
  }

  function renderWidget(el) {
    var type = el.getAttribute("data-quiver-widget");
    var id = el.getAttribute("data-id");
    var theme = el.getAttribute("data-theme") || "dark";

    if (!type || !id) { renderError(el); return; }

    el.innerHTML = '<div class="qm-loading">Loading\u2026</div>';

    var url;
    if (type === "market") url = QUIVER_BASE + "/api/embed/market/" + encodeURIComponent(id);
    else if (type === "arb") url = QUIVER_BASE + "/api/embed/disagreement/" + encodeURIComponent(id);
    else if (type === "whale") url = QUIVER_BASE + "/api/embed/whale/" + encodeURIComponent(id);
    else if (type === "category") url = QUIVER_BASE + "/api/embed/category/" + encodeURIComponent(id);
    else { renderError(el); return; }

    fetchData(url, function (err, data) {
      if (err || !data || data.error) { renderError(el); return; }
      if (type === "market") renderMarket(el, data, theme);
      else if (type === "arb") renderArb(el, data, theme);
      else if (type === "whale") renderWhale(el, data, theme);
      else if (type === "category") renderCategory(el, data, theme);
    });
  }

  function init() {
    injectStyles();
    var widgets = document.querySelectorAll("[data-quiver-widget]");
    for (var i = 0; i < widgets.length; i++) renderWidget(widgets[i]);

    setInterval(function () {
      var ws = document.querySelectorAll("[data-quiver-widget]");
      for (var j = 0; j < ws.length; j++) renderWidget(ws[j]);
    }, REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
