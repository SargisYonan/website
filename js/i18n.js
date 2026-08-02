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
      syr: "ܝܘܢ ܚܕ݇ ܡܚܪܐ ܒܓܝܓ݂ܠܐ ܕܚܫܘܒ݂̈ܐ ܘܪܘܒܘܛܝܩܝܐ ܘܟܦܠܚܢ ܥܠ ܬܚܪ̈ܙܝܬܐ ܦܪܝܫ̈ܐ ܒܟܠ ܕܪ̈ܓ݂ܐ. ܐܦ ܐܝܬ ܠܝ ܪܒܐ ܦܘܪ̈ܣܐ ܒܚܩܠܐ ܕܬܪܓܡܘܬܐ ܘܓܪܫܬܐ ܕܟܬܒ݂ܬܐ ܒܠܫܢܐ ܐܬܘܪܝܐ. ܡܚܪܐ ܝܘܢ ܦܠܚܐ ܠܛܘܦ̮ܣܝ̈ܐ ܩܕ݇ܡܝ̈ܐ ܓܘ ܣܝܥܬܐ ܕܬܦܢܟ݂ܢ̈ܐ ܕܐܦܠ."
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
    "proj-cldr-desc": {
      en: "Major contributions to the Unicode SYR common language data repository. 2021 - Present.",
      syr: "ܬܪ̈ܓܡܝܬܐ ܘܡܬܩܢܬܐ ܕܠܫܢܐ ܣܘܪܝܝܐ ܓܘ ܫܘܬܦܘܬܐ ܕUnicode، ܡ݂ܢ 2021 ܗܠ ܐܕܝܘܡ."
    },
    "proj-mamlal-title": { en: "Mamlal", syr: "ܡܡܠܠ" },
    "proj-mamlal-desc": {
      en: "An Assyrian language Wordle clone.",
      syr: "ܛܐܠܬܐ ܕܘܘܪܕܠ ܒܠܫܢܐ ܐܬܘܪܝܐ."
    }
  };

  function currentLang() {
    return document.documentElement.getAttribute("lang") === "syr" ? "syr" : "en";
  }

  function applyLang(lang) {
    var isSyr = lang === "syr";
    document.documentElement.setAttribute("lang", isSyr ? "syr" : "en");
    document.documentElement.setAttribute("dir", isSyr ? "rtl" : "ltr");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var entry = translations[el.getAttribute("data-i18n")];
      if (entry) el.textContent = isSyr ? entry.syr : entry.en;
    });

    toggle.setAttribute("data-active", isSyr ? "syr" : "en");

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  toggle.addEventListener("click", function () {
    applyLang(currentLang() === "syr" ? "en" : "syr");
  });

  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}
  if (saved === "syr") applyLang("syr");
})();
