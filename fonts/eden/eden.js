/* Eden design log. Draws outlines straight from eden-data.js (exported
   from Eden.glyphs by tools/build_proof.py) next to the reference fonts,
   with each letter from log.js. */
(function () {
  "use strict";

  var DATA = window.EDEN_DATA;
  var LOG = window.EDEN_LOG;
  var M = DATA.metrics;

  // Manuscript → flat, with Eden in between.
  var SOURCES = [
    { key: "ctesiphon", label: "Ctesiphon", note: "Manuscript" },
    { key: "ramsina", label: "Ramsina", note: "Calligraphic" },
    { key: "eden", label: "Eden", note: "This font" },
    { key: "noto", label: "Noto", note: "Geometric" }
  ];

  var state = { metrics: true, letter: null };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function edenGlyph(name) {
    var g = name && DATA.eden[name];
    return g && g.d ? g : null;
  }
  // Joining forms in display order. A letter's card leads with the first
  // form that is drawn; the rest are shown underneath it.
  var FORM_ORDER = ["", "isol", "init", "medi", "fina", "final", "finalisolate", "fina.unjoined",
    "fin2", "fin3", "med2", "lamadh"];
  var FORM_LABEL = {
    "": "Isolated", isol: "Isolated", final: "Final", fina: "Final",
    finalisolate: "Final / isolated", "fina.unjoined": "Final, unjoined",
    fin2: "Final 2", fin3: "Final 3", init: "Initial", medi: "Medial", medial: "Medial",
    med2: "Medial 2", lamadh: "After Lamad"
  };
  // What each form is for, shown beside its row.
  var FORM_NOTE = {
    "": "standing alone", init: "starts a joined run", medi: "joined on both sides",
    fina: "ends a joined run", "fina.unjoined": "ends a word after a letter that doesn't join",
    fin2: "after a letter that doesn't join", fin3: "after Dalat or Rish",
    med2: "joined, mid-word", lamadh: "after Lamad"
  };

  // Glyphs named <glyph> or <glyph>.<form suffix>, exported or not (a form
  // switched off for export is still a form). Other suffixes are parts.
  // A letter with no drawn form yet falls back to its .base drawing.
  function formsOf(entry, includeEmpty) {
    var base = entry.glyph;
    var list = Object.keys(DATA.eden).filter(function (n) {
      if (!includeEmpty && !DATA.eden[n].d) return false;
      if (n === base) return true;
      return n.indexOf(base + ".") === 0 && FORM_LABEL.hasOwnProperty(n.slice(base.length + 1));
    }).map(function (n) {
      var suffix = n === base ? "" : n.slice(base.length + 1);
      return { name: n, g: DATA.eden[n], label: FORM_LABEL[suffix] || suffix, rank: FORM_ORDER.indexOf(suffix) };
    });
    // Hand-drawn forms lead; stand-ins filled from parts come after.
    list.sort(function (a, b) {
      return ((a.g.filled ? 100 : 0) + (a.rank < 0 ? 99 : a.rank)) -
        ((b.g.filled ? 100 : 0) + (b.rank < 0 ? 99 : b.rank));
    });
    if (!includeEmpty && !list.length && edenGlyph(base + ".base")) {
      list.push({ name: base + ".base", g: DATA.eden[base + ".base"], label: "Base only", rank: 99, baseOnly: true });
    }
    return list;
  }
  function suffixOf(entry, name) {
    return name === entry.glyph ? "" : name.slice(entry.glyph.length + 1);
  }
  // A reference font's glyph for one form of a letter, as HarfBuzz picks it
  // (exported by tools/build_proof.py).
  function refForm(src, entry, suffix) {
    var ref = DATA.refs[src];
    var ch = entry.ref || entry.char;
    if (!ref) return null;
    if (!suffix) return ref[ch] || null;
    return ref.forms && ref.forms[ch] && ref.forms[ch][suffix] || null;
  }
  // Eden's lead form, and the same form in the reference fonts.
  function glyphFor(src, entry) {
    var lead = formsOf(entry)[0];
    if (src === "eden") return lead ? lead.g : null;
    return refForm(src, entry, lead && !lead.baseOnly ? suffixOf(entry, lead.name) : "") || refForm(src, entry, "");
  }

  // Shared frame for a set of glyphs so every cell in a row is drawn at
  // the same scale: widest advance or ink, and the union of vertical
  // extents with the Eden metrics.
  function frame(glyphs) {
    var top = M.ascender + 60, bottom = M.descender - 60, width = 500;
    glyphs.forEach(function (g) {
      if (!g) return;
      var b = g.b || [0, 0, g.w, 0];
      top = Math.max(top, b[3] + 60);
      bottom = Math.min(bottom, b[1] - 60);
      width = Math.max(width, g.w + 160, b[2] - b[0] + 160);
    });
    return { top: top, bottom: bottom, width: width };
  }

  function metricLines(f, labels) {
    var lines = [
      [0, "Baseline", true], [M["Shleṭa Top"], "Shleṭa 100"],
      [M.ascender, "Ascender " + M.ascender], [M.descender, "Descender " + M.descender]
    ];
    return lines.map(function (l) {
      var y = -l[0];
      return '<line class="ed-ml' + (l[2] ? " ed-ml--base" : "") + '" x1="' + (-f.width / 2) +
        '" x2="' + (f.width / 2) + '" y1="' + y + '" y2="' + y + '"/>' +
        (labels ? '<text class="ed-ml-label" x="' + (-f.width / 2 + 14) + '" y="' + (y - 12) + '">' + l[1] + "</text>" : "");
    }).join("");
  }

  function svg(g, f, opts) {
    opts = opts || {};
    var h = f.top - f.bottom;
    var out = '<svg class="ed-svg" viewBox="' + (-f.width / 2) + " " + (-f.top) + " " + f.width + " " + h +
      '" role="img" aria-label="' + esc(opts.label || "") + '">';
    if (state.metrics || opts.metrics) out += metricLines(f, opts.labels);
    if (g) {
      out += '<g transform="translate(' + (-g.w / 2) + ' 0) scale(1 -1)">';
      out += '<path class="ed-ink" d="' + g.d + '"/>';
      out += "</g>";
    } else {
      out += '<text class="ed-empty" x="0" y="' + (-M["Shleṭa Top"]) + '" text-anchor="middle">' + esc(opts.empty || "Not drawn") + "</text>";
    }
    return out + "</svg>";
  }

  /* ---- Spectrum ---------------------------------------------------------- */
  // Bet in all four fonts at the same scale, from ink on paper to flat geometry.
  function renderSpectrum() {
    var entry = LOG.filter(function (e) { return e.char === "ܒ"; })[0];
    if (!entry) return;
    var glyphs = SOURCES.map(function (s) { return glyphFor(s.key, entry); });
    var f = frame(glyphs);
    $("[data-spectrum]").innerHTML = SOURCES.map(function (s, i) {
      return '<figure class="ed-spec-cell' + (s.key === "eden" ? " is-eden" : "") + '">' +
        svg(glyphs[i], f, { label: entry.name + " in " + s.label, metrics: true }) +
        "<figcaption><b>" + s.label + "</b><span>" + s.note + "</span></figcaption></figure>";
    }).join("");
  }

  /* ---- Grid diagram -------------------------------------------------------- */
  // The alphabet in its traditional groups (abgad, hawaz, ḥaṭi, kalman,
  // saʿpas, qarshat), each set in Eden itself so every form and join is
  // what the font does. All are drawn at the same scale.
  var ALPHABET_LINES = ["ܐܒܓܕ", "ܗܘܙ", "ܚܛܝ", "ܟܠܡܢ", "ܣܥܦܨ", "ܩܪܫܬ"];

  function renderGrid() {
    var host = $("[data-grid]");
    var top = M.ascender + 80, bottom = M.descender - 60;
    function draw(width) {
      var half = width / 2;
      host.innerHTML = ALPHABET_LINES.map(function (line) {
        var s = '<svg class="ed-svg" viewBox="' + (-half) + " " + (-top) + " " + width + " " + (top - bottom) +
          '" role="img" aria-label="' + line + '">';
        s += '<rect class="ed-shleta" x="' + (-half) + '" y="-100" width="' + width + '" height="100"/>';
        for (var x = -Math.floor(half / 50) * 50; x <= half; x += 50) {
          s += '<line class="ed-col" x1="' + x + '" x2="' + x + '" y1="' + -M.ascender + '" y2="' + -M.descender + '"/>';
        }
        for (var y = M.descender; y <= M.ascender; y += 100) {
          s += '<line class="ed-band" x1="' + (-half) + '" x2="' + half + '" y1="' + -y + '" y2="' + -y + '"/>';
          s += '<text class="ed-ml-label" x="' + (-half + 14) + '" y="' + (-y - 12) + '" style="font-size:' + Math.round(width / 40) + 'px">' + y + "</text>";
        }
        // Lines start at the right, as Syriac does, with room for the labels on the left.
        return s + '<text class="ed-grid-word" x="' + (half - 50) + '" y="0" direction="rtl" text-anchor="start" lang="syr">' +
          line + "</text></svg>";
      }).join("");
    }
    draw(2000);
    var ready = document.fonts ? document.fonts.load("1000px Eden", ALPHABET_LINES.join("")) : Promise.resolve();
    ready.then(function () {
      var widest = Math.max.apply(null, $$(".ed-grid-word", host).map(function (t) { return t.getComputedTextLength(); }));
      draw(Math.ceil((widest + 400) / 100) * 100);
    }).catch(function () {});
  }

  /* ---- Letters ----------------------------------------------------------- */
  function renderLetter(entry) {
    var lead = formsOf(entry)[0];
    // One row per form Eden has (drawn or not), in reading order, each
    // comparing the same form across the four fonts.
    var rows = formsOf(entry).sort(function (a, b) {
      return (a.rank < 0 ? 99 : a.rank) - (b.rank < 0 ? 99 : b.rank);
    });
    if (!rows.length && lead) rows = [lead];
    var cellsByRow = rows.map(function (x) {
      var suffix = x.baseOnly ? "" : suffixOf(entry, x.name);
      return SOURCES.map(function (s) {
        return s.key === "eden" ? (x.g && x.g.d ? x.g : null) : refForm(s.key, entry, suffix);
      });
    });
    var f = frame([].concat.apply([], cellsByRow));
    var meta = Array.from(entry.char).map(function (c) {
      return "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    }).join(" + ") + (entry.char.length > 1 ? " · ligature" : "");
    var optional = (DATA.dlig || []).indexOf(entry.char) >= 0;
    var html =
      '<header class="ed-letter-head">' +
        '<span class="ed-letter-char" lang="syr">' + entry.char + "</span>" +
        '<div><h3 class="ed-letter-name">' + entry.name + '</h3><div class="ed-letter-meta">' + meta + "</div>" +
          (optional ? '<p class="ed-letter-note">Optional: off by default. Turn it on with discretionary ligatures ' +
            '(<code>font-variant-ligatures: discretionary-ligatures</code> in CSS, or the Discretionary Ligatures ' +
            'option in InDesign, Word and other apps). The rest of this page sets text with it off.</p>' : "") +
        "</div>" +
      "</header>";
    html += rows.map(function (x, r) {
      var suffix = x.baseOnly ? "" : suffixOf(entry, x.name);
      return '<div class="ed-form-row">' +
        '<div class="ed-form-row-head"><b>' + esc(x.label) + "</b>" +
        (FORM_NOTE[suffix] ? "<span>" + esc(FORM_NOTE[suffix]) + "</span>" : "") +
        '<code>' + esc(x.name) + (x.g.x === 0 ? " · not exported" : "") + "</code>" +
        "</div>" +
        '<div class="ed-compare">' + SOURCES.map(function (s, i) {
          var cell = cellsByRow[r][i];
          var eden = s.key === "eden";
          return '<figure class="ed-cell' + (eden ? " is-eden" : "") + (eden && x.g.filled ? " is-standin" : "") + '">' +
            svg(cell, f, { label: entry.name + ", " + x.label + ", in " + s.label,
                           empty: eden ? "Not drawn" : "No such form" }) +
            (r === 0 ? "<figcaption>" + s.label + "</figcaption>" : "") + "</figure>";
        }).join("") + "</div></div>";
    }).join("");
    return html;
  }

  // Mirrors count as the part they mirror. Shleṭa units and lengths,
  // connectors and their patches are plumbing, left out of the parts list.
  function sourcePart(n) { return n.replace(/\.mirror$/, ""); }
  function shownPart(n) {
    if (/\.mirror$/.test(n) || /\.(unit|connector|patch)$/.test(n)) return false;
    return !/\.shlita$/.test(n) || n === "syriac-upstroke-unit.shlita";
  }

  /* ---- Parts ------------------------------------------------------------- */
  // Every non-exporting glyph used as a component, with the letters that
  // contain it at any depth in any of their forms.
  function contains(name, part, depth) {
    var g = DATA.eden[name];
    if (!g || !g.parts || depth > 10) return false;
    return g.parts.some(function (p) { return sourcePart(p) === part || contains(p, part, depth + 1); });
  }

  function users(part) {
    return LOG.filter(function (e) {
      return formsOf(e).some(function (x) { return x.name === part || contains(x.name, part, 0); });
    });
  }

  function renderParts() {
    var used = {};
    Object.keys(DATA.eden).forEach(function (n) {
      (DATA.eden[n].parts || []).forEach(function (p) { used[p] = true; });
    });
    // Every non-exporting part in use: the strokes, not the .base skeletons,
    // except a skeleton other letters are built from too (Waw's ring, in
    // He, Mim, Pe and Semkat).
    var SHARED_BASES = ["waw-syriac.isol.base"];
    var names = Object.keys(DATA.eden).filter(function (n) {
      return edenGlyph(n) && DATA.eden[n].x === 0 && used[n] && shownPart(n) &&
        (!/\.base$/.test(n) || SHARED_BASES.indexOf(n) >= 0);
    }).sort(function (a, b) {
      return users(b).length - users(a).length || a.localeCompare(b);
    });
    renderPartGrid("[data-parts]", names);
  }

  function renderPartGrid(sel, names) {
    var f = frame(names.map(edenGlyph));
    $(sel).innerHTML = names.map(function (n) {
      var u = users(n);
      return '<figure class="ed-part" id="p-' + n.replace(/\./g, "-") + '">' +
        svg(edenGlyph(n), f, { label: n }) +
        "<figcaption><b>" + esc(n) + "</b>" +
        '<span class="ed-part-users">' + (u.length
          ? u.map(function (e) { return '<a href="#l-' + e.name.toLowerCase() + '" title="' + e.name + '" lang="syr"><span class="ed-syr-lift">' + e.char + "</span></a>"; }).join("")
          : "—") + "</span></figcaption></figure>";
    }).join("");
  }

  // One letter at a time: the one picked in the index (or linked to as
  // #l-name), or none.
  function letterId(e) { return "l-" + e.name.toLowerCase(); }

  function renderLetters() {
    var e = LOG.filter(function (x) { return letterId(x) === state.letter; })[0];
    $("[data-letters]").innerHTML = e
      ? '<article class="ed-letter" id="' + letterId(e) + '" data-status="' + e.status + '">' + renderLetter(e) + "</article>"
      : '<p class="ed-letters-empty">Click a letter above to see its forms.</p>';
    $$("[data-index] .dz-chip").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.id === state.letter));
    });
  }

  function renderIndex() {
    $("[data-index]").innerHTML = LOG.map(function (e) {
      return '<button type="button" class="dz-chip ed-chip-syr" data-id="' + letterId(e) + '" title="' + e.name +
        '" aria-controls="letter-view" aria-pressed="false" lang="syr"><span class="ed-syr-lift">' + e.char + "</span></button>";
    }).join("");
  }

  function showLetter(id, scroll) {
    var known = LOG.some(function (e) { return letterId(e) === id; });
    state.letter = known ? id : null;
    renderLetters();
    if (known && scroll) $("#" + id).scrollIntoView({ block: "start" });
  }

  function initLetters() {
    $("[data-letters]").id = "letter-view";
    $("[data-index]").addEventListener("click", function (ev) {
      var b = ev.target.closest(".dz-chip");
      if (!b) return;
      var id = b.dataset.id;
      // Clicking the open letter closes it.
      if (id === state.letter) {
        history.replaceState(null, "", location.pathname + location.search);
        showLetter(null, false);
      } else {
        history.replaceState(null, "", "#" + id);
        showLetter(id, false);
      }
    });
    // Links from elsewhere on the page (a part's letters) and on load.
    // Only #l-… links pick a letter; a section link (#grid) leaves it alone.
    function linked() { return /^#l-/.test(location.hash) ? location.hash.slice(1) : null; }
    window.addEventListener("hashchange", function () { if (linked()) showLetter(linked(), true); });
    // A letter linked to opens (and scrolls into view); otherwise Alap is open.
    if (linked()) showLetter(linked(), true);
    else showLetter("l-alap", false);
  }

  /* ---- Text ------------------------------------------------------------- */
  // Every letter of the alphabet, plain and pointed: "That little boy in
  // the garden hears the sweet voice of a bird."
  var SPECIMEN = "ܗܘ ܛܠܝܐ ܙܥܘܪܐ ܒܓܢܬܐ ܟܐ ܫܡܥ ܩܠܐ ܒܣܝܡܐ ܕܚܕ ܨܦܪܐ.";
  var SPECIMEN_POINTED = "ܗܵܘ ܛܲܠܝܵܐ ܙܥܘܿܪܵܐ ܒܓܲܢܬܵܐ ܟܹܐ ܫܵܡܸܥ ܩܵܠܵܐ ܒܲܣܝܼܡܵܐ ܕܚܲܕ ܨܸܦܪܵܐ.";
  // "The little boy saw a beautiful bird on a branch in the garden in
  // front of the house."
  var GARDEN = "ܛܠܝܐ ܙܥܘܪܐ ܚܙܐ ܠܗ ܨܦܪܐ ܫܦܝܪܐ ܥܠ ܣܘܟܐ ܒܓܢܬܐ ܩܕܡ ܒܝܬܐ.";
  var GARDEN_POINTED = "ܛܲܠܝܵܐ ܙܥܘܿܪܵܐ ܚܙܹܐ ܠܹܗ ܨܸܦܪܵܐ ܫܲܦܝܼܪܵܐ ܥܲܠ ܣܵܘܟܵܐ ܒܓܲܢܬܵܐ ܩܵܕ݇ܡ ܒܲܝܬܵܐ.";

  function initText() {
    var tester = $("[data-ed-tester]");
    if (!tester) return;
    var stage = $("[data-ed-stage]");
    stage.textContent = SPECIMEN;
    $$("[data-ed-ctl]", tester).forEach(function (input) {
      var update = function () {
        var k = input.dataset.edCtl;
        stage.style.setProperty(k === "size" ? "--size" : "--leading", k === "size" ? input.value + "px" : input.value);
        $('[data-ed-out="' + k + '"]', tester).textContent = k === "size" ? input.value + "px" : input.value;
      };
      input.addEventListener("input", update);
      update();
    });
    $("[data-ed-invert]").addEventListener("click", function () {
      var on = tester.classList.toggle("is-inverted");
      this.setAttribute("aria-pressed", String(on));
    });
    $("[data-ed-waterfall]").innerHTML = [12, 14, 16, 18, 24, 32, 48, 64, 96, 128].map(function (sz) {
      return '<div class="dz-wf-row"><span class="dz-wf-size">' + sz + 'px</span>' +
        '<span class="dz-wf-text ed-font" lang="syr" dir="rtl" style="font-size:' + sz + 'px">' + esc(SPECIMEN) + "</span></div>";
    }).join("");
    $("[data-ed-samples]").innerHTML = [
      ["Every letter", SPECIMEN], ["Every letter, with vowels", SPECIMEN_POINTED],
      ["A bird in the garden", GARDEN], ["A bird in the garden, with vowels", GARDEN_POINTED]
    ].map(function (t) {
      return '<div class="ed-sample"><span class="ed-sample-label">' + esc(t[0]) + '</span>' +
        '<p class="ed-sample-text" lang="syr" dir="rtl" style="font-size:32px;line-height:1.9">' + esc(t[1]) + "</p></div>";
    }).join("");
  }

  /* ---- Controls ---------------------------------------------------------- */
  /* ---- Hero: type "Eden", backspace it, retype it in Eden ---------------- */
  function initHero() {
    var h = $("[data-hero-title]");
    if (!h) return;
    var word = $(".ed-hero-word", h);
    var SYRIAC = "ܥܕܢ";
    function toSyriac() {
      h.classList.add("is-syriac");
      word.setAttribute("lang", "syr");
      word.setAttribute("dir", "rtl");
    }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      toSyriac();
      word.textContent = SYRIAC;
      h.classList.add("is-done");
      return;
    }
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var fontReady = document.fonts ? document.fonts.load("1em Eden", SYRIAC).catch(function () {}) : Promise.resolve();
    (async function () {
      await wait(1400);
      h.classList.add("is-typing");
      var latin = word.textContent;
      for (var i = latin.length - 1; i >= 0; i--) {
        word.textContent = latin.slice(0, i);
        await wait(110);
      }
      h.classList.remove("is-typing");
      await Promise.all([fontReady, wait(500)]);
      toSyriac();
      h.classList.add("is-typing");
      for (var j = 1; j <= SYRIAC.length; j++) {
        word.textContent = SYRIAC.slice(0, j);
        await wait(240);
      }
      h.classList.remove("is-typing");
      await wait(2200);
      h.classList.add("is-done");
    })();
  }

  function init() {
    initHero();
    initText();
    renderSpectrum();
    renderGrid();
    renderParts();
    renderIndex();
    initLetters();

    $$("[data-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.toggle;
        state[k] = !state[k];
        $$('[data-toggle="' + k + '"]').forEach(function (x) { x.setAttribute("aria-pressed", String(state[k])); });
        renderParts();
        renderLetters();
      });
    });
  }

  init();
})();
