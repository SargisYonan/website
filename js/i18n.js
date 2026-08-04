/*
 * Homepage language toggle: English <-> Assyrian (Syriac script, RTL).
 *
 * The Assyrian strings below are a best-effort first draft, not a
 * professional translation — proper nouns, project names, and technical
 * project/publication descriptions are intentionally left in English.
 */
(function () {
  "use strict";

  var toggle = document.querySelector("[data-lang-toggle]");
  if (!toggle) return;

  var STORAGE_KEY = "lang";

  var translations = {
    "hero-first": { en: "Sargis", syr: "ܣܪܓܝܣ" },
    "hero-last": { en: "Yonan", syr: "ܝܘܢـــــــܢ" },
    "about-text": {
      en: "I'm an engineer who works on robotics, hardware, firmware, software and Assyrian language projects. I'm a prototyping engineer on the Apple Design Team, focused on interaction design.",
      syr: "ܝܘܢ ܡܚܪܐ ܒܓܝܓ݂ܠܐ ܕܚܫܘܒ݂̈ܐ ܘܪܘܒܘܛܝܩܝܐ, ܘܦܠܚܢ ܥܠ ܬܚܪ̈ܙܝܬܐ ܦܪܝܫ̈ܐ ܒܟܠ ܕܪ̈ܓ݂ܐ. ܐܦ ܐܝܬ ܠܝ ܥܒ݂̈ܕܝܬܐ ܒܚܩܠܐ ܕܓܪܫܬܐ ܘܟܬܒ݂ܬܐ ܕܠܫܢܐ ܐܬܘܪܝܐ. ܗܕܝܐ ܝ݇ܘܢ ܦܠܚܐ ܠܛܘܦ̮ܣܝ̈ܐ ܩܕ݇ܡܝ̈ܐ ܓܘ ܒܝܬ ܬܦܢܟ݂ܐ ܕܐܦܠ."
    },
    "label-projects": { en: "Select Projects", syr: "ܥܒ݂̈ܕܝܬܐ" },
    "label-publications": { en: "Publications", syr: "ܦܘܪ̈ܣܐ" },
    "label-contact": { en: "Contact", syr: "ܡܛܝ̈ܬܐ" },
    "more-word": { en: "More", syr: "ܚܙܝ ܒܘܫ ܙܘܕܐ" },
    "resume-word": { en: "Resume", syr: "ܪܙܘܡܐ" },
    "footer-name": { en: "Sargis Yonan", syr: "ܣܪܓܝܤ ܝܘܢܢ" },
    "proj-nohadra-title": { en: "The Nohadra Syriac Fonts Collection", syr: "ܟܢܘܫܝܐ ܕܦ̮ܘܢܬ ܕܢܘܗܕܪܐ" },
    "font-label-sapna": { en: "Sapna", syr: "ܨܦܢܐ" },
    "font-label-amedia": { en: "Amedia", syr: "ܐܡܕܝܐ" },
    "proj-nohadra-desc": {
      en: "A bold, geometric, monospaced Syriac typeface family with square, block-like characters and uniform line thickness.",
      syr: "ܚܕ ܟܢܘܫܝܐ ܕܓܪ̈ܫܐ ܕܟܬܒ݂ܐ ܒܠܫܢܐ ܐܬܘܪܝܐ، ܒܐܬܘܬ̈ܐ ܒܕܡܝܐ ܠܡܪܒܥ̈ܐ، ܘܒܣܪ̈ܛܐ ܕܐܝܬ ܠܗܘܢ ܚܕܐ ܥܒ݂ܝܘܬܐ."
    },
    "proj-cldr-title": { en: "Unicode CLDR", syr: "ܝܘܢܝܟܘܕ" },
    "proj-cldr-desc": {
      en: "Major contributions to the Unicode SYR common language data repository. 2021 - Present.",
      syr: "ܬܪ̈ܓܡܝܬܐ ܘܡܬܩܢܬܐ ܕܠܫܢܐ ܣܘܪܝܝܐ ܓܘ ܫܘܬܦܘܬܐ ܕܝܘܢܝܟܘܕ، ܡ݂ܢ 2021 ܗܠ ܐܕܝܘܡ."
    },
    "proj-mamlal-title": { en: "Mamlal", syr: "ܡܡܠܠ" },
    "proj-mamlal-desc": {
      en: "An Assyrian language Wordle clone.",
      syr: "ܛܐܠܬܐ ܕܘܘܪܕܠ ܒܠܫܢܐ ܐܬܘܪܝܐ."
    },
    "contact-github": { en: "GitHub", syr: "ܓܝܬܗܒ" },
    "contact-linkedin": { en: "LinkedIn", syr: "ܠܝܢܟܕܝܢ" }
  };

  var heroFirst = document.querySelector('[data-i18n="hero-first"]');
  var heroLast = document.querySelector('[data-i18n="hero-last"]');
  var heroPhoto = document.querySelector(".hero-photo");
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function currentLang() {
    return document.documentElement.getAttribute("lang") === "syr" ? "syr" : "en";
  }

  function updateTitle(isSyr) {
    document.title = isSyr ? translations["footer-name"].syr : translations["footer-name"].en;
  }

  function setNonHeroText(isSyr) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (el === heroFirst || el === heroLast) return;
      var entry = translations[el.getAttribute("data-i18n")];
      if (entry) el.textContent = isSyr ? entry.syr : entry.en;
    });
  }

  function finishSwitch(isSyr, lang) {
    document.documentElement.setAttribute("lang", isSyr ? "syr" : "en");
    document.documentElement.setAttribute("dir", isSyr ? "rtl" : "ltr");
    updateTitle(isSyr);
    setNonHeroText(isSyr);
    if (heroFirst) heroFirst.textContent = isSyr ? translations["hero-first"].syr : translations["hero-first"].en;
    if (heroLast) heroLast.textContent = isSyr ? translations["hero-last"].syr : translations["hero-last"].en;
    toggle.setAttribute("data-active", isSyr ? "syr" : "en");
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function applyLang(lang) {
    finishSwitch(lang === "syr", lang);
  }

  function applyLangAnimated(lang) {
    var isSyr = lang === "syr";
    var photoBefore = heroPhoto ? heroPhoto.getBoundingClientRect() : null;

    [heroFirst, heroLast].forEach(function (el) {
      if (el) {
        el.style.transition = "opacity 0.2s ease";
        el.style.opacity = "0";
      }
    });

    window.setTimeout(function () {
      document.documentElement.setAttribute("lang", isSyr ? "syr" : "en");
      document.documentElement.setAttribute("dir", isSyr ? "rtl" : "ltr");
      updateTitle(isSyr);
      setNonHeroText(isSyr);

      if (heroPhoto && photoBefore) {
        var photoAfter = heroPhoto.getBoundingClientRect();
        var deltaX = photoBefore.left - photoAfter.left;
        if (deltaX) {
          heroPhoto.style.transition = "none";
          heroPhoto.style.transform = "translateX(" + deltaX + "px)";
          // eslint-disable-next-line no-unused-expressions
          heroPhoto.getBoundingClientRect();
          requestAnimationFrame(function () {
            heroPhoto.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
            heroPhoto.style.transform = "";
          });
        }
      }

      if (heroFirst) heroFirst.textContent = isSyr ? translations["hero-first"].syr : translations["hero-first"].en;
      if (heroLast) heroLast.textContent = isSyr ? translations["hero-last"].syr : translations["hero-last"].en;

      requestAnimationFrame(function () {
        if (heroFirst) heroFirst.style.opacity = "1";
        window.setTimeout(function () {
          if (heroLast) heroLast.style.opacity = "1";
        }, 200);
      });

      toggle.setAttribute("data-active", isSyr ? "syr" : "en");
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {}

      window.setTimeout(function () {
        toggle.removeAttribute("data-switching");
      }, 600);
    }, 200);
  }

  toggle.addEventListener("click", function () {
    if (toggle.hasAttribute("data-switching")) return;
    var next = currentLang() === "syr" ? "en" : "syr";
    if (reduceMotion) {
      applyLang(next);
    } else {
      toggle.setAttribute("data-switching", "1");
      applyLangAnimated(next);
    }
  });

  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}
  if (saved === "syr") applyLang("syr");

  window.setTimeout(function () {
    toggle.classList.add("is-peeking");
    toggle.addEventListener(
      "animationend",
      function () {
        toggle.classList.remove("is-peeking");
      },
      { once: true }
    );
  }, 900);
})();
