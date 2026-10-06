/* Rika Analytics — lightweight event tracker (T-B5-11 / ANALYTICS-1)
 *
 * Tracks: pageview, tool_use, config_change, cta_click, lead_created,
 *         quote_created, design_saved, booking_created, deposit_initiated,
 *         deposit_paid
 *
 * - No PII. Session ID is a UUID in localStorage (no cookies).
 * - Batched: events queue up and flush on beforeunload + every 5s.
 * - POSTs to /rika/api/track (guest, no auth).
 * - If the endpoint is down, events are silently dropped (no page impact).
 */
(function () {
	if (window.__RIKA_TRACK_LOADED__) return;
	window.__RIKA_TRACK_LOADED__ = true;

	var TRACK_URL = (window.RikaConfig && window.RikaConfig.TRACK_URL) || "/rika/api/track";
	var FLUSH_MS = 5000;
	var MAX_QUEUE = 50;

	/* --- Session ID (UUID in localStorage, no cookies) --- */
	function getSessionId() {
		try {
			var id = localStorage.getItem("rika_sid");
			if (!id) {
				id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
				localStorage.setItem("rika_sid", id);
			}
			return id;
		} catch (e) {
			return "r" + Date.now().toString(36);
		}
	}

	/* --- Referrer / UTM source --- */
	function getSource() {
		try {
			var ref = document.referrer;
			if (!ref || ref === "about:blank") return "direct";
			var host;
			try {
				host = new URL(ref).hostname;
			} catch (e) {
				host = ref;
			}
			if (host.indexOf("rika") !== -1 || host === "localhost") return "direct";
			// UTM campaign from query string
			var qs = new URLSearchParams(window.location.search);
			var camp = qs.get("utm_campaign") || qs.get("gclid") || qs.get("fbclid") || null;
			if (camp) return camp;
			return host;
		} catch (e) {
			return "direct";
		}
	}

	/* --- Device detection --- */
	function getDevice() {
		var ua = navigator.userAgent || "";
		var isMobile = /Mobi|Android|iPhone|iPad|Tablet/i.test(ua);
		var isTablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);
		if (isTablet) return "Tablet";
		if (isMobile) return "Mobile";
		return "Desktop";
	}

	/* --- Tool from page path --- */
	function getTool() {
		var p = window.location.pathname;
		var map = {
			"/rika/tools/calculator/": "calculator",
			"/rika/tools/visualizer/": "visualizer",
			"/rika/tools/design/": "design",
			"/rika/tools/quiz/": "quiz",
			"/rika/tools/build/": "build",
			"/rika/tools/house-windows/": "house-windows",
			"/rika/tools/house-map/": "house-map",
			"/rika/tools/measure/": "measure",
			"/rika/tools/quotation/": "quotation",
			"/rika/compare/": "compare",
			"/rika/prices/": "prices",
			"/rika/guide/": "guide",
			"/rika/costs/": "costs",
			"/rika/locations/": "locations",
			"/rika/app/": "app",
			"/rika/leads/": "leads",
		};
		for (var k in map) {
			if (p.indexOf(k) !== -1) return map[k];
		}
		// Product pages
		var m = p.match(/\/rika\/products\/([a-z-]+)\//);
		if (m) return "products/" + m[1];
		if (p.indexOf("/rika/products/") !== -1) return "products";
		return "home";
	}

	/* --- Event queue --- */
	var queue = [];
	var sessionId = getSessionId();
	var page = window.location.pathname;
	var source = getSource();
	var device = getDevice();
	var tool = getTool();
	var pageviewSent = false;

	function makeEvent(type, meta) {
		return {
			event_type: type,
			tool: tool,
			page: page,
			source: source,
			session_id: sessionId,
			device: device,
			event_ts: new Date().toISOString().replace("T", " ").substring(0, 19),
			meta: meta || null,
		};
	}

	function track(type, meta) {
		queue.push(makeEvent(type, meta));
		if (queue.length > MAX_QUEUE) queue.shift();
	}

	function flush() {
		if (!queue.length) return;
		var batch = queue.splice(0, queue.length);
		try {
			fetch(TRACK_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ events: batch }),
				keepalive: true,
			}).catch(function () {});
		} catch (e) {
			/* silent */
		}
	}

	/* --- Pageview (fire once) --- */
	function trackPageview() {
		if (pageviewSent) return;
		pageviewSent = true;
		track("pageview");
		track("tool_use");
	}

	/* --- CTA click tracking (event delegation) --- */
	function trackCtaClick(e) {
		var el = e.target;
		while (el && el !== document) {
			if (el.tagName === "A" || el.tagName === "BUTTON") break;
			el = el.parentElement;
		}
		if (!el || el === document) return;
		var href = el.href || el.getAttribute("data-action") || "";
	 var label = (el.textContent || "").trim().substring(0, 60);
		var action = null;
		if (href.indexOf("wa.me") !== -1) action = "whatsapp";
		else if (href.indexOf("/rika/api/quote") !== -1 || label.indexOf("quote") !== -1) action = "quote";
		else if (label.indexOf("save my design") !== -1) action = "save_design";
		else if (label.indexOf("exact quote") !== -1) action = "exact_quote";
		else if (label.indexOf("measurement") !== -1 || href.indexOf("booking") !== -1) action = "booking";
		else if (label.indexOf("calculator") !== -1) action = "calculator";
		if (!action) return;
		track("cta_click", { action: action, label: label });
	}

	/* --- Config change tracking (tool inputs) --- */
	var configTimer = null;
	function trackConfigChange(meta) {
		track("config_change", meta || {});
	}

	/* --- Wire up --- */
	function init() {
		trackPageview();
		document.addEventListener("click", trackCtaClick, true);
		setInterval(flush, FLUSH_MS);
		window.addEventListener("beforeunload", flush);
		window.addEventListener("pagehide", flush);

		// Expose for tool JS to call
		window.rikaTrack = {
			track: track,
			configChange: trackConfigChange,
			flush: flush,
			pageview: trackPageview,
		};
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
