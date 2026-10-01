/*
 * Font specimen pages (fonts/diba, fonts/nohadra): kashida hero, type
 * tester, glyph inspector and proofs. Each page describes its font in a
 * window.SPECIMEN config before loading this script.
 * Vanilla JS, no dependencies.
 */
(function () {
  "use strict";

  var C = window.SPECIMEN;
  if (!C) return;

  var TATWEEL = "ـ";
  var ZWJ = "‍";
  var root = document.documentElement;
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Joining type per letter: "D" dual-joining, "R" right-joining only.
  var LETTERS = [
    ["ܐ", "Alaph", "R"], ["ܒ", "Beth", "D"], ["ܓ", "Gamal", "D"], ["ܕ", "Dalath", "R"],
    ["ܖ", "Dotless Dalath-Resh", "R"], ["ܗ", "He", "R"], ["ܘ", "Waw", "R"], ["ܙ", "Zain", "R"],
    ["ܚ", "Heth", "D"], ["ܛ", "Teth", "D"], ["ܝ", "Yudh", "D"], ["ܟ", "Kaph", "D"],
    ["ܠ", "Lamadh", "D"], ["ܡ", "Mim", "D"], ["ܢ", "Nun", "D"], ["ܣ", "Semkath", "D"],
    ["ܤ", "Final Semkath", "D"], ["ܥ", "E", "D"], ["ܦ", "Pe", "D"], ["ܨ", "Sadhe", "R"],
    ["ܩ", "Qaph", "D"], ["ܪ", "Resh", "R"], ["ܫ", "Shin", "D"], ["ܬ", "Taw", "R"]
  ]
    .concat(C.extraLetters || [])
    .sort(function (a, b) { return a[0].codePointAt(0) - b[0].codePointAt(0); });
  var JOINING = {};
  LETTERS.forEach(function (l) { JOINING[l[0]] = l[2]; });

  var MARK_RE = /[̀-ܑͯܰ-᷺᷸݊]/;
  var MARKS_G = /[̀-ܑͯܰ-᷺᷸݊]/g;

  var ALPHABET = "ܐܒܓܕܗܘܙܚܛܝܟܠܡܢܣܥܦܨܩܪܫܬ";

  function cp(ch) {
    return "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function syr(e) {
    e.lang = "syr";
    e.dir = "rtl";
    return e;
  }

  function chip(label, pressed) {
    var b = el("button", "dz-chip", label);
    b.type = "button";
    b.setAttribute("aria-pressed", pressed ? "true" : "false");
    return b;
  }

  // Insert n tatweels after every dual-joining letter (and its marks) that
  // is followed by another letter, stretching each join in the word.
  function stretch(text, n) {
    if (!n) return text;
    var chars = Array.from(text);
    var out = "";
    var pad = TATWEEL.repeat(n);
    for (var i = 0; i < chars.length; i++) {
      out += chars[i];
      if (JOINING[chars[i]] !== "D") continue;
      var j = i + 1;
      while (j < chars.length && MARK_RE.test(chars[j])) out += chars[j++];
      i = j - 1;
      if (j < chars.length && JOINING[chars[j]]) out += pad;
    }
    return out;
  }

  // Draw the font's design grid behind `box`, with one line on the
  // baseline and one at the glyph's left design edge. Positions are in px
  // relative to the box.
  function placeGrid(box, x, baseline, fontSize) {
    if (!C.grid) return;
    var unit = C.grid.unit * fontSize;
    box.style.setProperty("--grid-unit", unit + "px");
    box.style.setProperty("--grid-x", x + "px");
    box.style.setProperty("--grid-y", baseline + "px");
  }

  /* ---- Styles ----------------------------------------------------------- */
  var styleListeners = [];
  var activeStyle = C.styles[0];

  function setStyle(id) {
    var s = C.styles.filter(function (x) { return x.id === id; })[0] || C.styles[0];
    activeStyle = s;
    root.style.setProperty("--sp-font", s.family);
    root.setAttribute("data-style", s.id);
    styleListeners.forEach(function (fn) { fn(s); });
  }

  (function initStyles() {
    var wrap = document.querySelector("[data-style-switch]");
    var initial = C.styles[0].id;
    try {
      var q = new URLSearchParams(window.location.search).get("style");
      if (q && C.styles.some(function (s) { return s.id === q; })) initial = q;
    } catch (e) {}

    if (wrap && C.styles.length > 1) {
      C.styles.forEach(function (s) {
        var b = chip(s.label, s.id === initial);
        b.setAttribute("data-style-id", s.id);
        b.addEventListener("click", function () {
          setStyle(s.id);
          try {
            var url = new URL(window.location.href);
            url.searchParams.set("style", s.id);
            window.history.replaceState(null, "", url);
          } catch (e) {}
        });
        wrap.appendChild(b);
      });
      styleListeners.push(function (s) {
        wrap.querySelectorAll("[data-style-id]").forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-style-id") === s.id ? "true" : "false");
        });
      });
    }
    // Applied once every section has registered its listener (end of file).
    activeStyle = C.styles.filter(function (s) { return s.id === initial; })[0];
  })();

  /* ---- Hero ------------------------------------------------------------- */
  (function initHero() {
    var stage = document.querySelector("[data-hero-stage]");
    var slider = document.querySelector("[data-hero-stretch]");
    var out = document.querySelector("[data-hero-out]");
    var play = document.querySelector("[data-hero-play]");
    if (!stage) return;

    // One stacked layer per style, so switching styles cross-fades.
    var layers = C.styles.map(function (s, i) {
      var h = syr(el(i === 0 ? "h1" : "div", "dz-hero-word"));
      h.style.fontFamily = s.family;
      h.setAttribute("data-style-id", s.id);
      stage.appendChild(h);
      return h;
    });
    layers[0].setAttribute("aria-label", C.name);
    for (var i = 1; i < layers.length; i++) layers[i].setAttribute("aria-hidden", "true");

    var base = C.heroWord;
    var max = C.heroMax;
    slider.max = max;
    var k = 0;
    var dir = 1;
    var timer = null;

    function placeHeroGrid() {
      var word = layers[0];
      var fs = parseFloat(getComputedStyle(word).fontSize);
      // Right-aligned word: its last advance edge is on the grid.
      var right = stage.clientWidth;
      placeGrid(stage, right, word.offsetTop + C.baseline * fs, fs);
    }

    function set(n) {
      k = n;
      var text = stretch(base, n);
      layers.forEach(function (h) { h.textContent = text; });
      slider.value = n;
      out.textContent = n;
    }

    function tick() {
      var next = k + dir;
      var hold = 70;
      if (next >= max || next <= 0) {
        dir = -dir;
        hold = 1400;
      }
      set(Math.max(0, Math.min(max, next)));
      timer = window.setTimeout(tick, hold);
    }

    function setPlaying(on) {
      window.clearTimeout(timer);
      timer = null;
      play.setAttribute("aria-pressed", on ? "true" : "false");
      play.textContent = on ? "Pause" : "Play";
      if (on) timer = window.setTimeout(tick, 600);
    }

    slider.addEventListener("input", function () {
      setPlaying(false);
      set(Number(slider.value));
    });
    play.addEventListener("click", function () {
      setPlaying(!timer);
    });

    styleListeners.push(function (s) {
      layers.forEach(function (h) {
        h.classList.toggle("is-active", h.getAttribute("data-style-id") === s.id);
      });
    });

    if (C.grid) {
      window.addEventListener("resize", placeHeroGrid);
      if (document.fonts) document.fonts.ready.then(placeHeroGrid);
      placeHeroGrid();
    }

    set(0);
    setPlaying(!reduceMotion);
  })();

  /* ---- Ticker ----------------------------------------------------------- */
  (function initTicker() {
    var track = document.querySelector("[data-ticker]");
    if (!track) return;
    // Two identical halves so translating by 50% loops seamlessly.
    for (var copy = 0; copy < 2; copy++) {
      for (var r = 0; r < 2; r++) {
        C.ticker.forEach(function (t) {
          track.appendChild(el("span", null, t));
          track.appendChild(el("span", null, "܀"));
        });
      }
    }
  })();

  /* ---- Tester ----------------------------------------------------------- */
  (function initTester() {
    var tester = document.querySelector("[data-tester]");
    if (!tester) return;
    var stage = tester.querySelector("[data-stage]");
    var presetsEl = tester.querySelector("[data-presets]");
    var keypad = tester.querySelector("[data-keypad]");
    var toggles = tester.querySelector(".dz-toggles");

    var state = { source: C.presets[0][1], kashida: 0, vowels: true, features: {} };
    var lastRange = null;

    function render() {
      var text = state.vowels ? state.source : state.source.replace(MARKS_G, "");
      stage.textContent = stretch(text, state.kashida);
    }

    stage.addEventListener("input", function () {
      var text = stage.innerText.replace(/\n$/, "");
      // Rendered kashida are presentation, not content.
      if (state.kashida) text = text.split(TATWEEL).join("");
      state.source = text;
      presetsEl.querySelectorAll(".dz-preset").forEach(function (b) {
        b.classList.remove("is-active");
      });
    });

    // Paste as plain text so pasted styling doesn't override the font.
    stage.addEventListener("paste", function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData("text");
      document.execCommand("insertText", false, text);
    });

    document.addEventListener("selectionchange", function () {
      var sel = window.getSelection();
      if (sel.rangeCount && stage.contains(sel.anchorNode)) lastRange = sel.getRangeAt(0).cloneRange();
    });

    // Sliders
    var fmt = {
      size: function (v) { return v + "px"; },
      leading: function (v) { return Number(v).toFixed(2); },
      kashida: function (v) { return v; }
    };
    tester.querySelectorAll("[data-ctl]").forEach(function (input) {
      var name = input.getAttribute("data-ctl");
      var output = tester.querySelector('[data-out="' + name + '"]');
      function apply() {
        var v = input.value;
        output.textContent = fmt[name](v);
        if (name === "size") stage.style.setProperty("--size", v + "px");
        if (name === "leading") stage.style.setProperty("--leading", v);
        if (name === "kashida") {
          state.kashida = Number(v);
          render();
        }
      }
      input.addEventListener("input", apply);
      apply();
    });

    // Fit the default size to narrow screens.
    if (window.innerWidth < 600) {
      var sizeInput = tester.querySelector('[data-ctl="size"]');
      sizeInput.value = 44;
      sizeInput.dispatchEvent(new Event("input"));
    }

    // OpenType feature toggles (stylistic sets etc.)
    if (C.features && C.features.length) tester.querySelector(".dz-controls").classList.add("has-features");
    (C.features || []).forEach(function (f) {
      var b = chip(f.label, false);
      b.title = f.title || "";
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", on ? "true" : "false");
        state.features[f.tag] = on;
        stage.style.fontFeatureSettings =
          Object.keys(state.features)
            .filter(function (t) { return state.features[t]; })
            .map(function (t) { return '"' + t + '" 1'; })
            .join(", ") || "normal";
      });
      toggles.insertBefore(b, toggles.firstChild);
    });

    // Toggles
    tester.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        var name = btn.getAttribute("data-toggle");
        if (name === "vowels") {
          state.vowels = on;
          render();
        } else if (name === "invert") {
          tester.classList.toggle("is-inverted", on);
        } else if (name === "keys") {
          keypad.hidden = !on;
        }
      });
    });

    // Presets
    C.presets.forEach(function (p, i) {
      var b = el("button", "dz-preset" + (i === 0 ? " is-active" : ""), p[0]);
      b.type = "button";
      b.addEventListener("click", function () {
        presetsEl.querySelectorAll(".dz-preset").forEach(function (x) {
          x.classList.toggle("is-active", x === b);
        });
        state.source = p[1];
        render();
      });
      presetsEl.appendChild(b);
    });

    // On-screen keyboard for visitors without a Syriac layout.
    function insert(text) {
      stage.focus();
      var sel = window.getSelection();
      sel.removeAllRanges();
      if (lastRange && stage.contains(lastRange.startContainer)) {
        sel.addRange(lastRange);
      } else {
        var r = document.createRange();
        r.selectNodeContents(stage);
        r.collapse(false);
        sel.addRange(r);
      }
      if (text === null) document.execCommand("delete");
      else document.execCommand("insertText", false, text);
    }

    function key(label, value, cls) {
      var b = el("button", "dz-key" + (cls ? " " + cls : ""), label);
      b.type = "button";
      // Keep focus (and the caret) in the stage.
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () { insert(value); });
      keypad.appendChild(b);
    }

    LETTERS.forEach(function (l) { key(l[0], l[0]); });
    C.keypadMarks.forEach(function (m) { key("◌" + m, m); });
    key("܀", "܀");
    key("Space", " ", "dz-key--wide");
    key("⌫", null, "dz-key--wide");

    render();
  })();

  /* ---- Glyph inspector -------------------------------------------------- */
  (function initInspector() {
    var grid = document.querySelector("[data-glyph-grid]");
    var metrics = document.querySelector("[data-metrics]");
    var nameEl = document.querySelector("[data-glyph-name]");
    var metaEl = document.querySelector("[data-glyph-meta]");
    var formsEl = document.querySelector("[data-forms]");
    var gridToggle = document.querySelector("[data-grid-toggle]");
    if (!grid) return;

    C.metrics.forEach(function (m) {
      var line = el("div", "dz-mline" + (m.v === 0 ? " dz-mline--base" : ""));
      line.style.setProperty("--v", m.v);
      line.appendChild(el("span", null, m.label));
      metrics.appendChild(line);
    });
    var big = syr(el("div", "dz-big-glyph dz-font"));
    metrics.appendChild(big);

    if (gridToggle) {
      if (C.grid) {
        gridToggle.hidden = false;
        gridToggle.addEventListener("click", function () {
          var on = gridToggle.getAttribute("aria-pressed") !== "true";
          gridToggle.setAttribute("aria-pressed", on ? "true" : "false");
          metrics.classList.toggle("has-grid", on);
          var hero = document.querySelector("[data-hero-stage]");
          if (hero) hero.classList.toggle("has-grid", on);
        });
      } else {
        gridToggle.remove();
      }
    }

    var FORM_NAMES = ["Isolated", "Initial", "Medial", "Final"];
    var formGlyphs = FORM_NAMES.map(function (name) {
      var cell = el("div", "dz-form");
      var g = syr(el("div", "dz-form-glyph dz-font"));
      cell.appendChild(g);
      cell.appendChild(el("div", "dz-form-label", name));
      formsEl.appendChild(cell);
      return { cell: cell, glyph: g };
    });

    var cells = [];
    var current = -1;
    var autoTimer = null;
    var swapTimer = null;

    // The glyph's left design edge sits at its box's left edge plus the
    // grid's x offset.
    function placeGlyphGrid() {
      if (!C.grid) return;
      var fs = parseFloat(getComputedStyle(metrics).fontSize);
      var left = metrics.clientWidth / 2 - big.offsetWidth / 2;
      placeGrid(metrics, left + C.grid.x * fs, big.offsetTop + C.baseline * fs, fs);
    }

    function setGlyph(ch) {
      big.textContent = ch;
      placeGlyphGrid();
    }

    function show(i) {
      if (i === current) return;
      current = i;
      var l = LETTERS[i];
      cells.forEach(function (c, j) { c.classList.toggle("is-active", j === i); });

      window.clearTimeout(swapTimer);
      big.classList.add("is-swapping");
      swapTimer = window.setTimeout(function () {
        setGlyph(l[0]);
        big.classList.remove("is-swapping");
      }, reduceMotion ? 0 : 140);

      nameEl.textContent = l[1];
      metaEl.textContent = cp(l[0]) + " · " + (l[2] === "D" ? "Dual-joining" : "Right-joining");

      var dual = l[2] === "D";
      var forms = [l[0], dual ? l[0] + ZWJ : null, dual ? ZWJ + l[0] + ZWJ : null, ZWJ + l[0]];
      forms.forEach(function (f, j) {
        formGlyphs[j].glyph.textContent = f || l[0];
        formGlyphs[j].cell.classList.toggle("is-na", !f);
        formGlyphs[j].cell.title = f ? "" : l[1] + " has no " + FORM_NAMES[j].toLowerCase() + " form";
      });
    }

    function stopAuto() {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }

    LETTERS.forEach(function (l, i) {
      var b = el("button", "dz-glyph-cell", l[0]);
      b.type = "button";
      b.setAttribute("data-cp", cp(l[0]).slice(2));
      b.setAttribute("aria-label", l[1]);
      b.addEventListener("mouseenter", function () { stopAuto(); show(i); });
      b.addEventListener("focus", function () { stopAuto(); show(i); });
      b.addEventListener("click", function () { stopAuto(); show(i); });
      grid.appendChild(b);
      cells.push(b);
    });

    show(0);
    setGlyph(LETTERS[0][0]);
    if (C.grid) {
      window.addEventListener("resize", placeGlyphGrid);
      if (document.fonts) document.fonts.ready.then(placeGlyphGrid);
      styleListeners.push(placeGlyphGrid);
    }

    // Cycle through the letters while the section is on screen, until the
    // visitor picks one.
    if (!reduceMotion && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && autoTimer === null && io) {
            autoTimer = window.setInterval(function () {
              show((current + 1) % LETTERS.length);
            }, 1600);
          } else if (!e.isIntersecting && autoTimer !== null) {
            stopAuto();
          }
        });
      });
      io.observe(grid.parentNode);
      function release() {
        if (io) io.disconnect();
        io = null;
        stopAuto();
      }
      grid.addEventListener("pointerdown", release);
      grid.addEventListener("mouseenter", release);
    }
  })();

  /* ---- Waterfall -------------------------------------------------------- */
  (function initWaterfall() {
    var wf = document.querySelector("[data-waterfall]");
    if (!wf) return;
    [12, 16, 20, 28, 36, 48, 64, 96, 128].forEach(function (size) {
      var row = el("div", "dz-wf-row");
      row.appendChild(el("div", "dz-wf-size", size + "px"));
      var t = syr(el("div", "dz-wf-text dz-font", C.waterfall));
      t.style.fontSize = size + "px";
      row.appendChild(t);
      wf.appendChild(row);
    });
  })();

  /* ---- Joins ------------------------------------------------------------ */
  (function initJoins() {
    var grid = document.querySelector("[data-joins]");
    if (!grid) return;
    function cell(text, label) {
      var c = el("div", "dz-join");
      c.appendChild(syr(el("div", "dz-join-text dz-font", text)));
      c.appendChild(el("div", "dz-join-label", label));
      grid.appendChild(c);
    }
    LETTERS.forEach(function (l) {
      if (l[2] === "D") cell("ܒ" + l[0] + "ܒ " + l[0] + l[0] + l[0], l[1]);
    });
    LETTERS.forEach(function (l) {
      if (l[2] === "R") cell("ܒ" + l[0] + " " + l[0] + l[0], l[1]);
    });
    (C.joinExtras || []).forEach(function (x) { cell(x[0], x[1]); });
  })();

  /* ---- Marks ------------------------------------------------------------ */
  (function initMarks() {
    var wrap = document.querySelector("[data-marks]");
    var carriers = document.querySelector("[data-carriers]");
    if (!wrap) return;
    var glyphs = [];
    C.marks.forEach(function (group) {
      if (group.title) wrap.appendChild(el("div", "dz-mark-group", group.title));
      var grid = el("div", "dz-mark-grid");
      group.items.forEach(function (m) {
        var c = el("div", "dz-mark");
        var g = syr(el("div", "dz-mark-glyph dz-font"));
        c.appendChild(g);
        c.appendChild(el("div", "dz-mark-name", m[1]));
        c.appendChild(el("div", "dz-mark-cp", cp(m[0])));
        grid.appendChild(c);
        glyphs.push([g, m[0]]);
      });
      wrap.appendChild(grid);
    });

    function setCarrier(base) {
      glyphs.forEach(function (g) { g[0].textContent = base + g[1]; });
      carriers.querySelectorAll(".dz-chip").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-base") === base ? "true" : "false");
      });
    }

    ["◌", "ܒ", "ܘ", "ܝ"].forEach(function (base) {
      var b = chip(base, false);
      b.setAttribute("data-base", base);
      b.setAttribute("aria-label", base === "◌" ? "Dotted circle" : "On " + base);
      b.addEventListener("click", function () { setCarrier(base); });
      carriers.appendChild(b);
    });
    setCarrier("◌");
  })();

  /* ---- Punctuation ------------------------------------------------------ */
  (function initPunct() {
    var wrap = document.querySelector("[data-punct]");
    if (!wrap) return;
    Array.from(C.punct).forEach(function (ch) {
      var c = el("div");
      c.appendChild(syr(el("div", "dz-p-glyph dz-font", ch)));
      c.appendChild(el("div", "dz-mark-cp", cp(ch)));
      wrap.appendChild(c);
    });
  })();

  /* ---- Reveal on scroll ------------------------------------------------- */
  (function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.remove("is-hidden");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".dz-reveal").forEach(function (s) {
      if (s.getBoundingClientRect().top > window.innerHeight) {
        s.classList.add("is-hidden");
        io.observe(s);
      }
    });
  })();

  setStyle(activeStyle.id);
})();
