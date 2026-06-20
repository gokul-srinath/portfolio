// Minimal, dependency-free interactions — kept light for cheap hosting.
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;
  var toggle = document.getElementById("modeToggle");
  var hint = document.getElementById("modeHint");
  var hintClose = document.getElementById("modeHintClose");
  var HINT_KEY = "gs-hint-seen";

  function applyMode(mode) {
    var comic = mode === "comic";
    body.classList.toggle("mode-comic", comic);
    body.classList.toggle("mode-pro", !comic);
    if (toggle) toggle.setAttribute("aria-pressed", String(comic));
    window.scrollTo(0, 0);
    requestAnimationFrame(observeReveals);
  }

  // Default is ALWAYS professional. Only a #comic deep-link starts in comic.
  if ((location.hash || "").toLowerCase() === "#comic") {
    applyMode("comic");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = body.classList.contains("mode-comic") ? "pro" : "comic";
      applyMode(next);
      dismissHint();
    });
  }

  // ---------- One-time hint nudging the comic edition ----------
  function dismissHint() {
    if (!hint) return;
    hint.setAttribute("hidden", "");
    body.classList.remove("hint-active");
    try { localStorage.setItem(HINT_KEY, "1"); } catch (e) {}
  }
  (function maybeShowHint() {
    if (!hint) return;
    var seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === "1"; } catch (e) {}
    if (seen || body.classList.contains("mode-comic")) return;
    setTimeout(function () {
      if (body.classList.contains("mode-comic")) return;
      hint.removeAttribute("hidden");
      body.classList.add("hint-active");
      setTimeout(dismissHint, 9000); // auto-dismiss
    }, 1400);
  })();
  if (hintClose) hintClose.addEventListener("click", dismissHint);
  if (hint) hint.addEventListener("click", function (e) {
    if (e.target === hintClose) return;
    applyMode("comic");
    dismissHint();
  });

  // ---------- Scroll reveal ----------
  var io = null;
  function observeReveals() {
    var els = document.querySelectorAll(".reveal, .reveal-pop");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }
    els.forEach(function (el) {
      if (!el.classList.contains("in") && el.offsetParent !== null) io.observe(el);
    });
  }
  observeReveals();

  // ---------- Count-up for numeric stats ----------
  var stats = document.querySelectorAll(".stat__num[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.textContent.trim().replace(/[0-9,]/g, "");
    var dur = 1100, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var val = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = val.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduce && "IntersectionObserver" in window) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); statIO.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { statIO.observe(el); });
  }
})();
