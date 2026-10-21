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

  var state = { metrics: true, letter: null, wght: 400 };

  // Every card the character map can open: the letters in the log, then a
  // plain card for each other character Eden has (eden-data.js "chars").
  var ENTRIES = LOG.slice();
  var BY_CHAR = {};
  LOG.forEach(function (e) { BY_CHAR[e.char] = e; });
  Object.keys(DATA.chars || {}).forEach(function (hex) {
    var c = DATA.chars[hex], ch = String.fromCodePoint(parseInt(hex, 16));
    if (BY_CHAR[ch]) return;
    var cp = parseInt(hex, 16);
    var e = { char: ch, name: c.n, glyph: c.g, id: "u-" + hex.toLowerCase(), mark: !!c.mark,
              kind: c.mark ? "Mark" : (cp >= 0x0710 && cp <= 0x072F) || cp === 0x0640 ? "" : "Punctuation" };
    ENTRIES.push(e);
    BY_CHAR[ch] = e;
  });

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---- Weights ----------------------------------------------------------- */
  // The letter log's weight slider. eden-data.js carries each letter form in
  // every master (g.m, by master id) and Noto at the matching weights
  // (refsAt); a weight between two masters interpolates their outlines,
  // which match command for command.
  var MASTERS = DATA.masters || [{ id: "m01", wght: 400 }];
  var NUM = /-?\d*\.?\d+/g;

  function bracket(stops, w) {
    for (var i = 0; i < stops.length - 1; i++) {
      if (w <= stops[i + 1]) return [i, Math.max(0, Math.min(1, (w - stops[i]) / (stops[i + 1] - stops[i])))];
    }
    return [stops.length - 2, 1];
  }

  function lerpGlyph(a, b, t, base) {
    if (!a || !b) return base;
    if (t === 0) return a;
    if (t === 1) return b;
    var nb = b.d.match(NUM) || [], i = 0;
    var d = a.d.replace(NUM, function (v) { var o = +v + (+nb[i++] - +v) * t; return String(Math.round(o * 10) / 10); });
    if (i !== nb.length) return base;
    var out = { w: a.w + (b.w - a.w) * t, d: d };
    if (a.b && b.b) out.b = a.b.map(function (v, k) { return v + (b.b[k] - v) * t; });
    return out;
  }

  // An Eden glyph at the slider's weight (its Regular drawing if a master is missing).
  function edenAt(g) {
    if (!g || !g.d || state.wght === 400 || !g.m) return g;
    var stops = MASTERS.map(function (m) { return m.wght; });
    var bt = bracket(stops, state.wght);
    function v(m) { return m.id === "m01" ? g : g.m[m.id] && { w: g.m[m.id][0], d: g.m[m.id][1], b: g.m[m.id][2] }; }
    var r = lerpGlyph(v(MASTERS[bt[0]]), v(MASTERS[bt[0] + 1]), bt[1], g);
    return r === g ? g : Object.assign({}, g, r);
  }

  // A reference glyph at the slider's weight: Noto follows (refsAt), the others are fixed.
  function refAt(src, pick) {
    var at = DATA.refsAt && DATA.refsAt[src];
    if (!at) return pick(DATA.refs[src]);
    var stops = MASTERS.map(function (m) { return m.wght; });
    var bt = bracket(stops, state.wght);
    function v(w) { return w === 400 ? pick(DATA.refs[src]) : at[w] && pick(at[w]); }
    var base = pick(DATA.refs[src]);
    return lerpGlyph(v(stops[bt[0]]), v(stops[bt[0] + 1]), bt[1], base);
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
  function refForm(src, entry, suffix, weighted) {
    var ch = entry.ref || entry.char;
    if (!DATA.refs[src]) return null;
    function pick(ref) {
      if (!suffix) return ref[ch] || null;
      return ref.forms && ref.forms[ch] && ref.forms[ch][suffix] || null;
    }
    return weighted ? refAt(src, pick) : pick(DATA.refs[src]);
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
      // A mark has no advance: centre it on its ink.
      var cx = g.w || !g.b ? g.w / 2 : (g.b[0] + g.b[2]) / 2;
      out += '<g transform="translate(' + (-cx) + ' 0) scale(1 -1)">';
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
        return s.key === "eden" ? (x.g && x.g.d ? edenAt(x.g) : null) : refForm(s.key, entry, suffix, true);
      });
    });
    var f = frame([].concat.apply([], cellsByRow));
    var meta = Array.from(entry.char).map(function (c) {
      return "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    }).join(" + ") + (entry.char.length > 1 ? " · ligature" : "");
    var optional = (DATA.dlig || []).indexOf(entry.char) >= 0;
    var html =
      '<header class="ed-letter-head">' +
        '<span class="ed-letter-char" lang="syr" style="font-weight:' + state.wght + '">' + shownChar(entry) + "</span>" +
        '<div><h3 class="ed-letter-name">' + entry.name + '</h3><div class="ed-letter-meta">' + meta + "</div>" +
          (optional ? '<p class="ed-letter-note">Optional: off by default. Turn it on with discretionary ligatures ' +
            '(<code>font-variant-ligatures: discretionary-ligatures</code> in CSS, or the Discretionary Ligatures ' +
            'option in InDesign, Word and other apps). The rest of this page sets text with it off.</p>' : "") +
        "</div>" +
      "</header>";
    html += rows.map(function (x, r) {
      var suffix = x.baseOnly ? "" : suffixOf(entry, x.name);
      return '<div class="ed-form-row">' +
        '<div class="ed-form-row-head"><b>' + esc(entry.kind || x.label) + "</b>" +
        (!entry.kind && FORM_NOTE[suffix] ? "<span>" + esc(FORM_NOTE[suffix]) + "</span>" : "") +
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
  function letterId(e) { return e.id || "l-" + e.name.toLowerCase(); }

  function renderLetters() {
    var e = ENTRIES.filter(function (x) { return letterId(x) === state.letter; })[0];
    $("[data-letters]").innerHTML = e
      ? '<article class="ed-letter" id="' + letterId(e) + '" data-status="' + e.status + '">' + renderLetter(e) + "</article>"
      : '<p class="ed-letters-empty">Click a letter above to see its forms.</p>';
    $$("[data-index] button.ed-cm-cell").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.id === state.letter));
    });
  }

  // The index is a character map laid out by code point like a Unicode
  // chart, 16 to a row (8 on a phone): the Syriac block (punctuation,
  // letters, vowels and other marks), then rows for the combining marks and
  // other punctuation Syriac text uses, and the ligatures. Everything Eden
  // has opens a card; code points Eden doesn't have are hatched.
  var CM_NARROW = window.matchMedia("(max-width: 640px)");
  var CM_GROUPS = [
    { label: "Marks", cps: [0x0303, 0x0304, 0x0307, 0x0308, 0x030A, 0x0323, 0x0324, 0x0325, 0x032D, 0x032E, 0x0330, 0x0331, 0x1DF8, 0x1DFA] },
    { label: "Punct.", cps: [0x060C, 0x061B, 0x061F, 0x0640, 0x2670, 0x2671] }
  ];

  function codeOf(c) { return c.toString(16).toUpperCase().padStart(4, "0"); }

  // Shown on a dotted circle when it's a combining mark.
  function shownChar(e) { return e.mark ? "\u25CC" + e.char : e.char; }

  // A mark in the map, drawn from its outline at the slider's weight, set
  // just above or below a dotted circle where a letter's body would be (as in
  // the Unicode charts).
  function markSvg(e) {
    var g = edenAt(edenGlyph(e.glyph));
    var tx = 0, ty = 0;
    if (g && g.b) {
      tx = -(g.b[0] + g.b[2]) / 2;
      ty = (g.b[1] + g.b[3]) / 2 > 150 ? 350 - g.b[1] : -60 - g.b[3];
    }
    return '<svg class="ed-cm-svg" viewBox="-350 -620 700 960" aria-hidden="true">' +
      '<circle cx="0" cy="-150" r="140" fill="none" stroke="currentColor" stroke-width="16" stroke-dasharray="32 24" opacity="0.6"/>' +
      (g ? '<path transform="translate(' + tx + " " + (-ty) + ') scale(1 -1)" d="' + g.d + '"/>' : "") + "</svg>";
  }

  function cmCell(text, codes, entry, cls) {
    var label = codes.map(function (c) { return "U+" + c; }).join(" + ");
    // Not drawn yet: an empty dashed box. A mark: its outline. Else: the character in Eden.
    var drawn = entry && Array.from(entry.char).length === 1 ? edenGlyph(entry.glyph) : true;
    var glyph = !entry ? "" : !drawn ? '<span class="ed-cm-empty"></span>' : entry.mark ? markSvg(entry) : text;
    var inner = '<span class="ed-cm-char" lang="syr" dir="rtl">' + glyph + '</span><span class="ed-cm-code">' + codes.join(" ") + "</span>";
    if (entry) {
      return '<button type="button" class="ed-cm-cell' + cls + '" data-id="' + letterId(entry) + '" title="' + label + " " + esc(entry.name) +
        '" aria-label="' + esc(entry.name) + ", " + label + '" aria-controls="letter-view" aria-pressed="false">' + inner + "</button>";
    }
    return '<div class="ed-cm-cell' + cls + '" title="' + label + ' (not in Eden)">' + inner + "</div>";
  }

  function cmCode(c, cols, col, last) {
    var e = BY_CHAR[String.fromCodePoint(c)];
    var cls = (col === cols - 1 ? " ed-cm-end" : "") + (last ? " ed-cm-last" : "") + (e ? "" : " is-none");
    return cmCell(e ? shownChar(e) : "", [codeOf(c)], e, cls);
  }

  function renderIndex() {
    var cols = CM_NARROW.matches ? 8 : 16;
    var host = $("[data-index]");
    host.style.setProperty("--cols", cols);
    var html = '<div class="ed-cm-head"></div>';
    for (var i = 0; i < cols; i++) {
      html += '<div class="ed-cm-head' + (i === cols - 1 ? " ed-cm-end" : "") + '">' + (cols === 16 ? i.toString(16).toUpperCase() : "+" + i) + "</div>";
    }
    for (var row = 0x0700; row < 0x0750; row += cols) {
      html += '<div class="ed-cm-head ed-cm-row">' + (cols === 16 ? codeOf(row).slice(0, 3) + "x" : codeOf(row)) + "</div>";
      for (var c = row; c < row + cols; c++) html += cmCode(c, cols, c - row, false);
    }
    // The other marks and punctuation, in rows of their own.
    CM_GROUPS.forEach(function (g) {
      for (var k = 0; k < g.cps.length; k += cols) {
        html += '<div class="ed-cm-head ed-cm-row">' + (k ? "" : g.label) + "</div>";
        var run = g.cps.slice(k, k + cols);
        html += run.map(function (c, j) { return cmCode(c, cols, j, false); }).join("");
        if (run.length < cols) html += '<div class="ed-cm-gap" style="grid-column: span ' + (cols - run.length) + '"></div>';
      }
    });
    // Ligatures: two columns each, then a filler to the end of the row.
    var ligs = LOG.filter(function (e) { return Array.from(e.char).length > 1; });
    html += '<div class="ed-cm-head ed-cm-row ed-cm-last">Lig.</div>';
    html += ligs.map(function (e) {
      var codes = Array.from(e.char).map(function (x) { return codeOf(x.codePointAt(0)); });
      return cmCell(e.char, codes, e, " ed-cm-lig ed-cm-last");
    }).join("");
    var rest = cols - 2 * ligs.length;
    if (rest > 0) html += '<div class="ed-cm-gap ed-cm-last" style="grid-column: span ' + rest + '"></div>';
    host.innerHTML = html;
  }

  function showLetter(id, scroll) {
    var known = ENTRIES.some(function (e) { return letterId(e) === id; });
    state.letter = known ? id : null;
    renderLetters();
    if (known && scroll) $("#" + id).scrollIntoView({ block: "start" });
  }

  function initLetters() {
    $("[data-letters]").id = "letter-view";
    $("[data-index]").addEventListener("click", function (ev) {
      var b = ev.target.closest("button.ed-cm-cell");
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
    function linked() { return /^#[lu]-/.test(location.hash) ? location.hash.slice(1) : null; }
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
        if (k === "weight") {
          // The variable font runs from ExtraLight (200) to Bold (700); the
          // waterfall follows the tester's weight.
          stage.style.fontWeight = input.value;
          $$("[data-ed-waterfall] .dz-wf-text").forEach(function (t) { t.style.fontWeight = input.value; });
        } else {
          stage.style.setProperty(k === "size" ? "--size" : "--leading", k === "size" ? input.value + "px" : input.value);
        }
        $('[data-ed-out="' + k + '"]', tester).textContent = k === "size" ? input.value + "px" : input.value;
      };
      input.addEventListener("input", update);
      update();
    });
    $("[data-ed-invert]").addEventListener("click", function () {
      var on = tester.classList.toggle("is-inverted");
      this.setAttribute("aria-pressed", String(on));
    });
    $("[data-ed-weights]").innerHTML = [
      [200, "ExtraLight"], [300, "Light"], [400, "Regular"], [500, "Medium"], [600, "SemiBold"], [700, "Bold"]
    ].map(function (w) {
      return '<div class="ed-sample"><span class="ed-sample-label">' + w[0] + " · " + w[1] + '</span>' +
        '<p class="ed-sample-text" lang="syr" dir="rtl" style="font-size:32px;line-height:1.5;font-weight:' + w[0] + '">' + esc(GARDEN) + "</p></div>";
    }).join("");
    $("[data-ed-waterfall]").innerHTML = [12, 14, 16, 18, 24, 32, 48, 64, 96, 128].map(function (sz) {
      return '<div class="dz-wf-row"><span class="dz-wf-size">' + sz + 'px</span>' +
        '<span class="dz-wf-text ed-font" lang="syr" dir="rtl" style="font-size:' + sz + 'px">' + esc(SPECIMEN) + "</span></div>";
    }).join("");
    $("[data-ed-samples]").innerHTML = [
      ["Every letter", SPECIMEN], ["Every letter, with vowels", SPECIMEN_POINTED],
      ["A bird in the garden", GARDEN], ["A bird in the garden, with vowels", GARDEN_POINTED]
    ].map(function (t) {
      return '<div class="ed-sample"><span class="ed-sample-label">' + esc(t[0]) + '</span>' +
        '<p class="ed-sample-text" lang="syr" dir="rtl" style="font-size:32px;line-height:1.5">' + esc(t[1]) + "</p></div>";
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
    // The weight slider redraws the open letter, and sets the map in that weight.
    var slider = $("[data-ed-log-weight]");
    slider.addEventListener("input", function () {
      state.wght = +slider.value;
      $("[data-ed-log-out]").textContent = slider.value;
      $("[data-index]").style.fontWeight = slider.value;
      renderIndex();
      renderLetters();
    });
    // The character map is 16 columns wide, or 8 on a phone.
    CM_NARROW.addEventListener("change", function () { renderIndex(); renderLetters(); });
  }

  init();
})();
