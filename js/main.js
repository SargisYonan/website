/*
 * Shared site behavior: footer year and scrolled topbar state.
 * Vanilla JS, no dependencies.
 */
(function () {
  "use strict";

  function initScrolledTopbar() {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    var onScroll = function () {
      bar.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initFooterYear() {
    var el = document.getElementById("copyright-year");
    if (el) el.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initScrolledTopbar();
    initFooterYear();
  });
})();
