/*
 * Assyrian crossword easter egg.
 * Triggered by a custom "aii-easter-egg" event (dispatched from i18n.js
 * after 3 language-toggle switches). Words and clues are drawn from a
 * curated set of 10 generated puzzles (js/data/crosswords.json), built
 * from a public Assyrian Neo-Aramaic dictionary (kaikki.org / Wiktionary).
 */
(function () {
  "use strict";

  var ALPHABET_ORDER = "ܐܒܓܕܗܘܙܚܛܝܟܠܡܢܣܥܦܨܩܪܫܬ".split("");

  // Same QWERTY-mapped row layout used by Mamlal (mamlal.com).
  var KEYBOARD_ROWS = ["ܩܘܥܪܬܝܛܦ".split(""), "ܐܣܕܓܗܟܠ".split(""), "ܙܚܨܫܒܢܡ".split("")];

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var overlay = null;
  var puzzles = null;
  var puzzlesPromise = null;
  var fireworksRaf = null;
  var state = null; // { puzzle, size, selected: {r,c}, dir: 'across'|'down', filled: [][], locked: [][], completed }

  function loadPuzzles() {
    if (puzzlesPromise) return puzzlesPromise;
    puzzlesPromise = fetch("js/data/crosswords.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        puzzles = data.puzzles;
        return puzzles;
      });
    return puzzlesPromise;
  }

  function buildOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "xword-overlay";
    overlay.setAttribute("dir", "rtl");
    overlay.setAttribute("hidden", "");
    overlay.innerHTML =
      '<div class="xword-panel">' +
      '  <div class="xword-header">' +
      '    <span class="xword-title">ܒܘܚܪܢܐ ܕܡܠ̈ܐ</span>' +
      '    <div class="xword-header-actions">' +
      '      <button type="button" class="xword-btn xword-btn--next" data-xword-new aria-label="New puzzle">&rarr;</button>' +
      '      <button type="button" class="xword-btn" data-xword-reveal>ܓܠܐ</button>' +
      '      <button type="button" class="xword-btn" data-xword-check>ܒܕܘܩ</button>' +
      '      <button type="button" class="xword-close" data-xword-close aria-label="Close">&times;</button>' +
      '    </div>' +
      "  </div>" +
      '  <div class="xword-body">' +
      '    <div class="xword-grid" data-xword-grid></div>' +
      '    <div class="xword-side">' +
      '      <div class="xword-keyboard" data-xword-keyboard></div>' +
      '      <div class="xword-clues">' +
      '        <div class="xword-clue-group">' +
      '          <div class="xword-clue-heading">ܡܬܚܙܝܢܐ</div>' +
      '          <ul class="xword-clue-list" data-xword-across></ul>' +
      "        </div>" +
      '        <div class="xword-clue-group">' +
      '          <div class="xword-clue-heading">ܢܚܘܬܐ</div>' +
      '          <ul class="xword-clue-list" data-xword-down></ul>' +
      "        </div>" +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      '  <div class="xword-status" data-xword-status></div>' +
      "</div>";
    document.body.appendChild(overlay);

    overlay.querySelector("[data-xword-close]").addEventListener("click", close);
    overlay.querySelector("[data-xword-new]").addEventListener("click", function () {
      loadPuzzles().then(function () {
        startPuzzle(nextPuzzleIndex());
      });
    });
    overlay.querySelector("[data-xword-check]").addEventListener("click", checkPuzzle);
    overlay.querySelector("[data-xword-reveal]").addEventListener("click", revealSelected);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (overlay.hasAttribute("hidden")) return;
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(e.key);
        return;
      }
      if (ALPHABET_ORDER.indexOf(e.key) !== -1) {
        e.preventDefault();
        typeLetter(e.key);
      }
    });

    return overlay;
  }

  var currentPuzzleIndex = -1;

  function nextPuzzleIndex() {
    currentPuzzleIndex = (currentPuzzleIndex + 1) % puzzles.length;
    return currentPuzzleIndex;
  }

  // Intentionally not persisted (no localStorage/sessionStorage): the
  // shortcut squares should only appear once the easter egg has been
  // freshly triggered again on this page load, every visit.
  function showShortcut() {
    var row = document.querySelector("[data-xword-shortcut]");
    if (row) row.classList.add("is-visible");
    var toggleRow = document.querySelector(".lang-toggle-row");
    if (toggleRow) toggleRow.classList.add("is-connected");
  }

  function markDiscovered() {
    showShortcut();
  }

  function open() {
    buildOverlay();
    loadPuzzles().then(function () {
      overlay.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
      startPuzzle(nextPuzzleIndex());
      markDiscovered();
    });
  }

  function close() {
    if (!overlay) return;
    stopFireworks();
    overlay.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  function startPuzzle(index) {
    stopFireworks();
    var puzzle = puzzles[index];
    var size = puzzle.size;
    var filled = [];
    var locked = [];
    for (var r = 0; r < size; r++) {
      var row = [];
      var lockedRow = [];
      for (var c = 0; c < size; c++) {
        row.push("");
        lockedRow.push(false);
      }
      filled.push(row);
      locked.push(lockedRow);
    }

    // find first playable cell for initial selection
    var firstCell = null;
    outer: for (var rr = 0; rr < size; rr++) {
      for (var cc = 0; cc < size; cc++) {
        if (puzzle.cells[rr][cc]) {
          firstCell = { r: rr, c: cc };
          break outer;
        }
      }
    }

    state = {
      puzzle: puzzle,
      size: size,
      filled: filled,
      locked: locked,
      selected: firstCell,
      dir: "across",
      completed: false,
    };

    setStatus("");
    renderGrid();
    renderKeyboard();
    renderClues();
    updateSelectionHighlight();
  }

  function cellAt(r, c) {
    if (r < 0 || c < 0 || r >= state.size || c >= state.size) return null;
    return state.puzzle.cells[r][c];
  }

  function wordCellsFor(r, c, dir) {
    var cells = [];
    if (!cellAt(r, c)) return cells;
    var dr = dir === "down" ? 1 : 0;
    var dc = dir === "across" ? 1 : 0;
    var sr = r,
      sc = c;
    while (cellAt(sr - dr, sc - dc)) {
      sr -= dr;
      sc -= dc;
    }
    var cr = sr,
      cc = sc;
    while (cellAt(cr, cc)) {
      cells.push({ r: cr, c: cc });
      cr += dr;
      cc += dc;
    }
    return cells;
  }

  function hasWordInDir(r, c, dir) {
    var dr = dir === "down" ? 1 : 0;
    var dc = dir === "across" ? 1 : 0;
    var before = cellAt(r - dr, c - dc);
    var after = cellAt(r + dr, c + dc);
    return !!(before || after);
  }

  function renderGrid() {
    var el = overlay.querySelector("[data-xword-grid]");
    el.innerHTML = "";
    el.style.setProperty("--xword-size", state.size);
    for (var r = 0; r < state.size; r++) {
      for (var c = 0; c < state.size; c++) {
        var cell = cellAt(r, c);
        var div = document.createElement("div");
        if (!cell) {
          div.className = "xword-cell xword-cell--blocked";
          el.appendChild(div);
          continue;
        }
        div.className = "xword-cell";
        div.setAttribute("data-r", r);
        div.setAttribute("data-c", c);
        if (cell.number) {
          var num = document.createElement("span");
          num.className = "xword-cell-number";
          num.textContent = cell.number;
          div.appendChild(num);
        }
        var letter = document.createElement("span");
        letter.className = "xword-cell-letter";
        letter.textContent = state.filled[r][c];
        div.appendChild(letter);
        div.addEventListener("click", function () {
          var rr = parseInt(this.getAttribute("data-r"), 10);
          var cc = parseInt(this.getAttribute("data-c"), 10);
          selectCell(rr, cc);
        });
        el.appendChild(div);
      }
    }
  }

  function selectCell(r, c) {
    if (!cellAt(r, c)) return;
    if (state.selected && state.selected.r === r && state.selected.c === c) {
      // toggle direction if the word exists in the other direction
      var other = state.dir === "across" ? "down" : "across";
      if (hasWordInDir(r, c, other)) state.dir = other;
    } else {
      state.selected = { r: r, c: c };
      if (!hasWordInDir(r, c, state.dir)) {
        state.dir = state.dir === "across" ? "down" : "across";
      }
    }
    updateSelectionHighlight();
  }

  function updateSelectionHighlight() {
    var wordCells = state.selected ? wordCellsFor(state.selected.r, state.selected.c, state.dir) : [];
    var wordKey = {};
    wordCells.forEach(function (wc) {
      wordKey[wc.r + "," + wc.c] = true;
    });
    var cells = overlay.querySelectorAll(".xword-cell:not(.xword-cell--blocked)");
    cells.forEach(function (div) {
      var r = parseInt(div.getAttribute("data-r"), 10);
      var c = parseInt(div.getAttribute("data-c"), 10);
      div.classList.toggle("is-selected", !!(state.selected && state.selected.r === r && state.selected.c === c));
      div.classList.toggle("is-word", !!wordKey[r + "," + c]);
    });

    var activeNumber = null;
    if (wordCells.length) {
      var start = wordCells[0];
      var startCell = cellAt(start.r, start.c);
      activeNumber = startCell ? startCell.number : null;
    }
    overlay.querySelectorAll(".xword-clue").forEach(function (li) {
      var isActive =
        li.getAttribute("data-dir") === state.dir && parseInt(li.getAttribute("data-number"), 10) === activeNumber;
      li.classList.toggle("is-active", isActive);
    });
  }

  function renderKeyboard() {
    var el = overlay.querySelector("[data-xword-keyboard]");
    el.innerHTML = "";
    KEYBOARD_ROWS.forEach(function (row, i) {
      var rowEl = document.createElement("div");
      rowEl.className = "xword-keyboard-row";
      row.forEach(function (ch) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "xword-key";
        btn.textContent = ch;
        btn.addEventListener("click", function () {
          typeLetter(ch);
        });
        rowEl.appendChild(btn);
      });
      if (i === KEYBOARD_ROWS.length - 1) {
        var back = document.createElement("button");
        back.type = "button";
        back.className = "xword-key xword-key--back";
        back.textContent = "⌫";
        back.addEventListener("click", backspace);
        rowEl.appendChild(back);
      }
      el.appendChild(rowEl);
    });
  }

  function typeLetter(ch) {
    if (!state.selected) return;
    var r = state.selected.r,
      c = state.selected.c;
    if (state.locked[r][c]) {
      advanceSelection(1);
      return;
    }
    state.filled[r][c] = ch;
    updateCellDisplay(r, c);
    clearCheckMark(r, c);
    advanceSelection(1);
    maybeCelebrate();
  }

  function backspace() {
    if (!state.selected) return;
    var r = state.selected.r,
      c = state.selected.c;
    if (state.locked[r][c]) {
      advanceSelection(-1);
      updateSelectionHighlight();
      return;
    }
    if (state.filled[r][c]) {
      state.filled[r][c] = "";
      updateCellDisplay(r, c);
      clearCheckMark(r, c);
    } else {
      advanceSelection(-1);
      if (state.selected && !state.locked[state.selected.r][state.selected.c]) {
        state.filled[state.selected.r][state.selected.c] = "";
        updateCellDisplay(state.selected.r, state.selected.c);
        clearCheckMark(state.selected.r, state.selected.c);
      }
    }
    updateSelectionHighlight();
  }

  function clearCheckMark(r, c) {
    var div = overlay.querySelector('.xword-cell[data-r="' + r + '"][data-c="' + c + '"]');
    if (div) div.classList.remove("is-correct", "is-wrong");
  }

  function revealSelected() {
    if (!state.selected) return;
    var r = state.selected.r,
      c = state.selected.c;
    var cell = cellAt(r, c);
    if (!cell) return;
    state.filled[r][c] = cell.answer;
    state.locked[r][c] = true;
    updateCellDisplay(r, c);
    var div = overlay.querySelector('.xword-cell[data-r="' + r + '"][data-c="' + c + '"]');
    if (div) {
      div.classList.add("is-correct", "is-locked");
      div.classList.remove("is-wrong");
    }
    maybeCelebrate();
  }

  // grid columns render mirrored under dir="rtl" (column 0 = rightmost on
  // screen), so left/right arrow keys are inverted relative to array index
  function moveSelection(key) {
    if (!state.selected) return;
    var r = state.selected.r,
      c = state.selected.c;
    var nr = r,
      nc = c;
    if (key === "ArrowLeft") nc = c + 1;
    else if (key === "ArrowRight") nc = c - 1;
    else if (key === "ArrowUp") nr = r - 1;
    else if (key === "ArrowDown") nr = r + 1;
    if (!cellAt(nr, nc)) return;
    if ((key === "ArrowLeft" || key === "ArrowRight") && hasWordInDir(nr, nc, "across")) {
      state.dir = "across";
    } else if ((key === "ArrowUp" || key === "ArrowDown") && hasWordInDir(nr, nc, "down")) {
      state.dir = "down";
    }
    state.selected = { r: nr, c: nc };
    updateSelectionHighlight();
  }

  function advanceSelection(step) {
    var wordCells = wordCellsFor(state.selected.r, state.selected.c, state.dir);
    var idx = wordCells.findIndex(function (wc) {
      return wc.r === state.selected.r && wc.c === state.selected.c;
    });
    var nextIdx = idx + step;
    if (nextIdx >= 0 && nextIdx < wordCells.length) {
      state.selected = wordCells[nextIdx];
      updateSelectionHighlight();
    }
  }

  function updateCellDisplay(r, c) {
    var div = overlay.querySelector('.xword-cell[data-r="' + r + '"][data-c="' + c + '"]');
    if (div) div.querySelector(".xword-cell-letter").textContent = state.filled[r][c];
  }

  function renderClues() {
    renderClueList(overlay.querySelector("[data-xword-across]"), state.puzzle.across, "across");
    renderClueList(overlay.querySelector("[data-xword-down]"), state.puzzle.down, "down");
  }

  function renderClueList(el, clues, dir) {
    el.innerHTML = "";
    clues.forEach(function (clue) {
      var li = document.createElement("li");
      li.className = "xword-clue";
      li.setAttribute("data-dir", dir);
      li.setAttribute("data-number", clue.number);
      li.innerHTML =
        '<span class="xword-clue-num">' + clue.number + "</span> " +
        '<span class="xword-clue-text">' + clue.clue + "</span>";
      li.addEventListener("click", function () {
        state.selected = { r: clue.row, c: clue.col };
        state.dir = dir;
        updateSelectionHighlight();
      });
      el.appendChild(li);
    });
  }

  function checkPuzzle() {
    var correct = 0,
      total = 0,
      allFilled = true;
    for (var r = 0; r < state.size; r++) {
      for (var c = 0; c < state.size; c++) {
        var cell = cellAt(r, c);
        if (!cell) continue;
        total++;
        var div = overlay.querySelector('.xword-cell[data-r="' + r + '"][data-c="' + c + '"]');
        var filledCh = state.filled[r][c];
        if (!filledCh) {
          allFilled = false;
          div.classList.remove("is-correct", "is-wrong");
          continue;
        }
        if (filledCh === cell.answer) {
          correct++;
          div.classList.add("is-correct");
          div.classList.remove("is-wrong");
        } else {
          div.classList.add("is-wrong");
          div.classList.remove("is-correct");
        }
      }
    }
    if (correct === total) {
      setStatus("ܒܪܝܟ݂ܐ! ܟܠܝ ܝܢܐ ܬܪܝܨܐ!");
      maybeCelebrate();
    } else if (allFilled) {
      setStatus("ܚܕ ܟܡܐ ܠܐ ܝܠܗ ܬܪܝܨܐ. ܙܘܼܙ ܬܘܼܒ݂.");
    } else {
      setStatus(correct + " / " + total + " ܬܪ̈ܝܨܐ ܗܠ ܐܕܝܐ.");
    }
  }

  function isPuzzleComplete() {
    for (var r = 0; r < state.size; r++) {
      for (var c = 0; c < state.size; c++) {
        var cell = cellAt(r, c);
        if (!cell) continue;
        if (state.filled[r][c] !== cell.answer) return false;
      }
    }
    return true;
  }

  function maybeCelebrate() {
    if (state.completed) return;
    if (!isPuzzleComplete()) return;
    state.completed = true;
    setStatus("ܒܪܝܟ݂ܐ! ܟܠܝ ܝܢܐ ܬܪܝܨܐ!");
    runFireworks();
  }

  function runFireworks() {
    if (reduceMotion) return;
    var panel = overlay.querySelector(".xword-panel");
    var canvas = document.createElement("canvas");
    canvas.className = "xword-fireworks";
    panel.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    canvas.width = panel.clientWidth;
    canvas.height = panel.clientHeight;

    var colors = ["#e0435c", "#3d8bd4", "#f2b705", "#39a845", "#a259d9", "#ff8a3d"];
    var particles = [];

    function spawnBurst(x, y) {
      var count = 40;
      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        var speed = 2.5 + Math.random() * 3;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    [0, 300, 650].forEach(function (delay) {
      window.setTimeout(function () {
        if (!canvas.isConnected) return;
        spawnBurst(canvas.width * (0.25 + Math.random() * 0.5), canvas.height * (0.2 + Math.random() * 0.4));
      }, delay);
    });

    var startTs = null;

    function frame(ts) {
      if (!startTs) startTs = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= 0.014;
      });
      particles = particles.filter(function (p) {
        return p.life > 0;
      });
      particles.forEach(function (p) {
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (ts - startTs < 2400 || particles.length) {
        fireworksRaf = requestAnimationFrame(frame);
      } else {
        fireworksRaf = null;
        canvas.remove();
      }
    }
    fireworksRaf = requestAnimationFrame(frame);
  }

  function stopFireworks() {
    if (fireworksRaf) {
      cancelAnimationFrame(fireworksRaf);
      fireworksRaf = null;
    }
    var canvas = overlay && overlay.querySelector(".xword-fireworks");
    if (canvas) canvas.remove();
  }

  function setStatus(msg) {
    var el = overlay.querySelector("[data-xword-status]");
    el.textContent = msg;
  }

  document.addEventListener("aii-easter-egg", open);

  (function initShortcut() {
    document.querySelectorAll("[data-xword-shortcut-btn]").forEach(function (btn) {
      btn.addEventListener("click", open);
    });
  })();
})();
