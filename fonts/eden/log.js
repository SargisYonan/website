/* Eden design log: one entry per letter, in alphabetical order, then the
   ligatures.

   status     "settled" | "drafting" | "sketch" | "todo"
   glyph      Eden glyph name without suffix. The page finds its drawn,
              forms (<glyph>, <glyph>.init, .medi, .fina, ...) in
              eden-data.js, and falls back to <glyph>.base when none exist.
   ref        character to pull from the reference fonts (defaults to `char`)
   summary    one sentence: what this letter is in Eden
   compare    how Ctesiphon, Ramsina, Noto and Eden each draw it
   decisions  [{ part, verdict: "keep" | "translate" | "drop", what, why, how }]

   Verdicts follow the test on the page: keep what identifies the letter,
   translate what the script needs but the pen produced, drop what only
   the pen produced. Syriac runs right to left, so a letter's left end is
   where a word stops: that is where the final tail goes. */

window.EDEN_LOG = [
  {
    char: "ܐ", name: "Alap", glyph: "alaph-syriac", status: "drafting",
    summary: "A swelling stem with a round ball on top, on a two-unit foot.",
    compare: "Ctesiphon cuts the head into a wedge and adds a hairline flick. Ramsina rounds the head and plants a flat foot; Eden is closest to it. Noto draws an even-weight hook that reads like a 2.",
    decisions: [
      { part: "Stem", verdict: "keep",
        what: "Wide at the foot, narrowing under the head.",
        why: "The swell is what makes it Alap.",
        how: "alap-vertical.stem" },
      { part: "Head", verdict: "translate",
        what: "A 135u ball instead of a chisel-cut wedge.",
        why: "The pen turns here, so it's round.",
        how: "Drawn in alap-vertical.stem" },
      { part: "Foot", verdict: "drop",
        what: "No flick. A plain block of Shleṭa.",
        why: "The flick is the pen leaving the page.",
        how: "syriac-2.shlita" },
      { part: "Final tail", verdict: "translate",
        what: "A short stub 75u below the line on final Alap.",
        why: "It marks the word's end without reaching under the next word.",
        how: "alaph-syriac.tail" }
    ]
  },
  {
    char: "ܒ", name: "Bet", glyph: "beth-syriac", status: "drafting",
    summary: "The concave arm on a 3½-unit Shleṭa. Its top and stem are reused across the font.",
    compare: "Ctesiphon and Ramsina raise a spur at the top left and curl the baseline up at the end. Noto flattens the top and stretches the right stem. Eden keeps the manuscript proportions, without the spur.",
    decisions: [
      { part: "Spur", verdict: "drop",
        what: "The arm just ends.",
        why: "The spur is where the nib landed. At 14px it's a smudge.",
        how: "concave-syriac.top" },
      { part: "Top", verdict: "keep",
        what: "A slight sag along the top.",
        why: "Enough that it doesn't look extruded.",
        how: "concave-syriac.top" },
      { part: "Stem", verdict: "keep",
        what: "Pinches in, then flares into the Shleṭa.",
        why: "The flare makes the corner look written.",
        how: "beth-syriac.stem" },
      { part: "Word-end curl", verdict: "translate",
        what: "Becomes the small final tail.",
        why: "Keeps the word ending without the sweep.",
        how: "final-syriac.tail" }
    ]
  },
  {
    char: "ܓ", name: "Gamal", glyph: "gamal-syriac", status: "drafting",
    summary: "The shared diagonal stem with a tail that drops below the line and ends in a bulb.",
    compare: "Ctesiphon and Ramsina end the tail in an angled cut or a square block. Noto does the same with a straight stroke. Only Eden turns the tail back up.",
    decisions: [
      { part: "Diagonal", verdict: "keep",
        what: "A pointed head and a bowed diagonal.",
        why: "The bow is the difference from Noto's ruler line.",
        how: "upswoop-syriac.stem in e-syriac.base" },
      { part: "Tail", verdict: "translate",
        what: "Falls to −222 and turns up into a bulb.",
        why: "The pen turns here, so it's round.",
        how: "gamal-syriac.tail" },
      { part: "Tail placement", verdict: "translate",
        what: "Swings out to the right at the start of a word; tucked under the body elsewhere.",
        why: "Only a word's first letter has nothing to its right.",
        how: "gamal-syriac.tail and its mirror" }
    ]
  },
  {
    char: "ܕ", name: "Dalat", glyph: "dalath-syriac", status: "drafting",
    summary: "A compact body with a rounded shoulder and the dot below.",
    compare: "Ctesiphon and Ramsina draw a small body with a square dot. Noto opens it into a wide bracket, still with a square dot. Eden's dot is round.",
    decisions: [
      { part: "Body", verdict: "keep",
        what: "Dalat and Rish share one body.",
        why: "Only the dot tells them apart.",
        how: "dalathrish-dotless-syriac.base" },
      { part: "Shoulder", verdict: "translate",
        what: "The wedge head becomes a rounded shoulder.",
        why: "The pen turns here.",
        how: "convex-syriac.arm" },
      { part: "Dot", verdict: "translate",
        what: "A 100u squircle instead of a square.",
        why: "Round to match the turns, with enough corner to hold up small.",
        how: "finishing-syriac.dot" }
    ]
  },
  {
    char: "ܗ", name: "He", glyph: "he-syriac", status: "drafting",
    summary: "Waw's ring with a bar across the top running into a stem on the right.",
    compare: "Ctesiphon and Ramsina draw a loop whose right stroke dips just below the line. Noto opens it into a wide loop with a tall upright. Eden uses Waw's ring and stops the stem on the line.",
    decisions: [
      { part: "Loop", verdict: "keep",
        what: "The same ring as Waw.",
        why: "Same pen movement, same drawing.",
        how: "waw-syriac.isol.base" },
      { part: "Right stroke", verdict: "translate",
        what: "A bar over the ring into Bet's stem, ending on the Shleṭa.",
        why: "The dip below the line is the pen's. The stem keeps the join in line with Bet.",
        how: "beth-syriac.stem and a bar path" }
    ]
  },
  {
    char: "ܘ", name: "Waw", glyph: "waw-syriac", status: "drafting",
    summary: "A round ring. The source of every loop in the font.",
    compare: "Ctesiphon and Ramsina draw a heavy, flat-bottomed loop with a small counter. Noto draws a large thin circle. Eden keeps the weight and small counter, fully round.",
    decisions: [
      { part: "Loop", verdict: "keep",
        what: "A round ring with an oval counter.",
        why: "The loop is the letter, and the pen only turns.",
        how: "waw-syriac.isol.base, also in Pe, He, Semkat and initial Mim" },
      { part: "Join", verdict: "translate",
        what: "A short Shleṭa off the right of the ring.",
        why: "The ring stays the same in every form.",
        how: "syriac-1.5.shlita" }
    ]
  },
  {
    char: "ܙ", name: "Zain", glyph: "zain-syriac", status: "drafting",
    summary: "A comma: a tilted oval head on a stroke that tapers below the line.",
    compare: "Ctesiphon and Ramsina draw a big comma. Noto makes it an upright bar. Eden keeps the comma, smaller, with an oval head.",
    decisions: [
      { part: "Head", verdict: "translate",
        what: "The finishing dot stretched into a tall oval and tilted 4°.",
        why: "The teardrop is the pen pressing down. An oval keeps the weight without the point.",
        how: "finishing-syriac.dot at ×1.49 × 1.99" },
      { part: "Stroke", verdict: "keep",
        what: "Tapers to a point at −125.",
        why: "The taper is the contrast, and the drop keeps it apart from Alap.",
        how: "zain-syriac.base" }
    ]
  },
  {
    char: "ܚ", name: "Khet", glyph: "heth-syriac", status: "drafting",
    summary: "Two Yud teeth on the Shleṭa.",
    compare: "Ctesiphon sets two upright thorns on a curved base. Ramsina slants them. Noto draws a tall zigzag. Eden keeps upright thorns on a flat base.",
    decisions: [
      { part: "Teeth", verdict: "keep",
        what: "Thorns with a near-vertical front.",
        why: "Teeth tell Khet, Yud and Sade apart.",
        how: "yudh-syriac.base ×2" },
      { part: "Tips", verdict: "translate",
        what: "Slightly rounded.",
        why: "A needle point disappears on screen.",
        how: "yudh-syriac.base" },
      { part: "Notch", verdict: "translate",
        what: "A small notch under each tooth.",
        why: "Keeps the join from filling in.",
        how: "syriac-upstroke-unit.shlita" }
    ]
  },
  {
    char: "ܛ", name: "Tet", glyph: "teth-syriac", status: "sketch",
    summary: "Eh's stroke on a longer Shleṭa, with a block below where the loop goes.",
    compare: "All three references run the diagonal through the Shleṭa into a triangular loop below. Eden squares the loop into a slanted slab.",
    decisions: [
      { part: "Upper stroke", verdict: "keep",
        what: "Eh's head and diagonal.",
        why: "Same stroke, same drawing.",
        how: "e-syriac.base" },
      { part: "Loop", verdict: "translate",
        what: "A slanted slab down to −100.",
        why: "Cuts become square, and it stays one Shleṭa deep.",
        how: "Two paths in teth-syriac.base" }
    ]
  },
  {
    char: "ܝ", name: "Yud", glyph: "yudh-syriac", status: "drafting",
    summary: "One tooth on a Shleṭa: the module for Khet and Sade.",
    compare: "Ctesiphon puts a thorn on a curved base, Ramsina slants it, Noto draws a pointed bump. Eden's stands upright on a flat base.",
    decisions: [
      { part: "Tooth", verdict: "keep",
        what: "One tooth with a unit of Shleṭa in front.",
        why: "One tooth everywhere keeps lines even.",
        how: "yudh-syriac.base" },
      { part: "Final", verdict: "translate",
        what: "The tooth plus the final tail; no curl.",
        why: "The tail does the curl's job.",
        how: "final-syriac.tail" }
    ]
  },
  {
    char: "ܟ", name: "Kap", glyph: "kaph-syriac", status: "drafting",
    summary: "A short hooked top at the start of a word; a tall top with a descender at the end.",
    compare: "Ctesiphon draws a tall Kap with a hairline tail. Ramsina's isolated is the short word-start shape. Noto is big and angular. Eden uses both: Ramsina's short shape to start a word, Ctesiphon's tall one to end it.",
    decisions: [
      { part: "Top", verdict: "keep",
        what: "Bet's concave top, narrowed.",
        why: "Kap and Bet share the scribe's top stroke.",
        how: "concave-syriac.top" },
      { part: "Initial", verdict: "keep",
        what: "A hook on a three-unit Shleṭa.",
        why: "Mid-word Kap is short in the scribal hand.",
        how: "kaph-syriac.init" },
      { part: "Descender", verdict: "translate",
        what: "Full weight, ending in a rounded upturn.",
        why: "The hairline is the pen running dry.",
        how: "kaph-syriac.fina, kaph-syriac" }
    ]
  },
  {
    char: "ܠ", name: "Lamad", glyph: "lamadh-syriac", status: "drafting",
    summary: "The diagonal stem stretched to the ascender.",
    compare: "Ctesiphon and Ramsina bow the stroke and point the head. Noto draws it straight. Eden bows it.",
    decisions: [
      { part: "Stem", verdict: "keep",
        what: "Gamal's stem, stretched to 500.",
        why: "One stem makes the family visible.",
        how: "upswoop-syriac.stem ×1.518" },
      { part: "Flag", verdict: "drop",
        what: "No flag at the top.",
        why: "The point already does the job.",
        how: "—" }
    ]
  },
  {
    char: "ܡ", name: "Mim", glyph: "mim-syriac", status: "drafting",
    summary: "Final: Bet's top with a leg through the Shleṭa. Initial: the diagonal stem beside Waw's ring.",
    compare: "Ctesiphon's isolated Mim is square with a hairline leg. Ramsina uses the round word-start loop. Noto is square with a long leg. Eden is square like Ctesiphon, with a short, heavy leg.",
    decisions: [
      { part: "Top and stem", verdict: "keep",
        what: "Bet's top and stem.",
        why: "Same top stroke as Bet.",
        how: "concave-syriac.top, beth-syriac.stem" },
      { part: "Leg", verdict: "keep",
        what: "A straight leg to −25.",
        why: "The leg makes it Mim, not Bet.",
        how: "mim-syriac.finalisolate.base" },
      { part: "Initial", verdict: "translate",
        what: "The diagonal stem into Waw's ring.",
        why: "A stroke into a loop, from shared parts.",
        how: "upswoop-syriac.stem, waw-syriac.isol.base" }
    ]
  },
  {
    char: "ܢ", name: "Nun", glyph: "nun-syriac", status: "drafting",
    summary: "A small Bet-like hook on the Shleṭa; at the end of a word, a descender.",
    compare: "Ctesiphon and Noto draw isolated Nun as a long diagonal below the line. Ramsina uses a short hooked shape. Eden is short like Ramsina when it starts a word, and keeps the long diagonal for the unjoined final.",
    decisions: [
      { part: "Head", verdict: "keep",
        what: "Bet's top, narrowed, on Bet's stem.",
        why: "The scribal Nun head is a small Bet hook.",
        how: "concave-syriac.top ×0.48, beth-syriac.stem" },
      { part: "Final", verdict: "translate",
        what: "A curved tail down to −200.",
        why: "Full weight instead of a hairline.",
        how: "Drawn in nun-syriac.fina" },
      { part: "Unjoined final", verdict: "keep",
        what: "A straight diagonal to −200 that hangs past the right edge.",
        why: "After a non-joining letter there's room to the right.",
        how: "nun-syriac.fina.unjoined" }
    ]
  },
  {
    char: "ܣ", name: "Semkat", glyph: "semkath-syriac", status: "drafting",
    summary: "Two of Waw's rings side by side on the Shleṭa.",
    compare: "All three references draw one loop with a curl folded inside, leaving a heart-shaped counter. Final Semkat adds a tail below the line. Eden replaces the curl with a second ring and leaves the tail off.",
    decisions: [
      { part: "Loops", verdict: "translate",
        what: "The folded curl becomes two overlapping rings.",
        why: "The curl is the pen doubling back. Two round counters keep the mass and stay open small.",
        how: "waw-syriac.isol.base ×2" },
      { part: "Final Semkat tail", verdict: "drop",
        what: "No tail below the line.",
        why: "The tail is the pen leaving the page; the two rings stay on the line.",
        how: "semkathFinal-syriac.isol.base" }
    ]
  },
  {
    char: "ܥ", name: "Eh", glyph: "e-syriac", status: "drafting",
    summary: "The diagonal stem on a 2½-unit Shleṭa, with a small flick at the start.",
    compare: "Ctesiphon and Ramsina curl the right end up. Noto turns it up in a sharp hook. Eden keeps a small flick.",
    decisions: [
      { part: "Diagonal", verdict: "keep",
        what: "A pointed head and bowed diagonal.",
        why: "Same stroke as Gamal, Lamad and Tet.",
        how: "e-syriac.base" },
      { part: "Flick", verdict: "translate",
        what: "A small upturn on the right.",
        why: "Without it, Eh is a short Lamad.",
        how: "init-syriac.tail" }
    ]
  },
  {
    char: "ܦ", name: "Pe", glyph: "pe-syriac", status: "drafting",
    summary: "Waw's ring, smaller, raised on a stem.",
    compare: "Ctesiphon and Ramsina draw a loop with a pointed spur at the top right. Noto opens it into a big bowl. Eden's is a round ring with no spur.",
    decisions: [
      { part: "Loop", verdict: "keep",
        what: "Waw's ring at 87%, lifted off the line.",
        why: "The lift tells Pe from Waw.",
        how: "waw-syriac.isol.base" },
      { part: "Stem", verdict: "keep",
        what: "A slim stem on the right; the left stays open.",
        why: "The open space under the loop is Pe's outline.",
        how: "vertical-slim-syriac.stem" }
    ]
  },
  {
    char: "ܨ", name: "Sade", glyph: "sadhe-syriac", status: "drafting",
    summary: "A Yud tooth and a body that sweeps down to a flat foot.",
    compare: "Ctesiphon sweeps into a long hairline. Ramsina's sweep is smaller. Noto opens it into a deep bowl with a flat foot. Eden keeps Noto's flat foot in a compact body.",
    decisions: [
      { part: "Tooth", verdict: "keep",
        what: "Yud's tooth, set apart by a half unit.",
        why: "So it doesn't read as part of the curve.",
        how: "yudh-syriac.base" },
      { part: "Foot", verdict: "translate",
        what: "A flat foot on the −200 line.",
        why: "Cuts become square.",
        how: "sadhe-syriac.isol.base" }
    ]
  },
  {
    char: "ܩ", name: "Qop", glyph: "qaph-syriac", status: "drafting",
    summary: "Bet's arm closed into a square counter.",
    compare: "Ctesiphon draws a square counter with horns. Ramsina is the same, more compact. Noto opens it into a wide box. Eden is closest to Ramsina.",
    decisions: [
      { part: "Arm", verdict: "keep",
        what: "Bet's concave arm.",
        why: "Same stroke, same drawing.",
        how: "concave-syriac.arm" },
      { part: "Counter", verdict: "translate",
        what: "A 100u square counter.",
        why: "On the grid and open at small sizes.",
        how: "Shleṭa units" }
    ]
  },
  {
    char: "ܪ", name: "Rish", glyph: "rish-syriac", status: "drafting",
    summary: "Dalat's body with the dot above.",
    compare: "The references use a square dot; Eden's is round.",
    decisions: [
      { part: "Body and dot", verdict: "keep",
        what: "Dalat's body and dot, the dot moved above.",
        why: "The dot is the only difference.",
        how: "dalathrish-dotless-syriac.base, finishing-syriac.dot" }
    ]
  },
  {
    char: "ܫ", name: "Shin", glyph: "shin-syriac", status: "drafting",
    summary: "A top bar on a post that flares into the Shleṭa.",
    compare: "Ctesiphon and Ramsina draw a bar with horns curling up. Noto arches the bar over a single post, close to Eden. Eden flattens the bar and flares the post.",
    decisions: [
      { part: "Construction", verdict: "translate",
        what: "Bet's top on a post, flared by two upside-down shoulders.",
        why: "Reuses Dalat's shoulder.",
        how: "concave-syriac.top, convex-syriac.arm and its mirror" }
    ]
  },
  {
    char: "ܬ", name: "Taw", glyph: "taw-syriac", status: "drafting",
    summary: "A heavy diagonal with a small hook at its foot.",
    compare: "Ctesiphon's loop dips below the line to a point. Ramsina's curls under near the line. Noto opens it into a thin triangle. Eden closes it into a small hook on the line.",
    decisions: [
      { part: "Diagonal", verdict: "keep",
        what: "A thick straight stroke.",
        why: "Its weight is how Taw is recognised.",
        how: "taw-syriac.stroke" },
      { part: "Loop", verdict: "translate",
        what: "A small hook on the line.",
        why: "The drop below the line was the pen's.",
        how: "taw-syriac.base" },
      { part: "Taw–Alap", verdict: "keep",
        what: "One shape before a final Alap.",
        why: "Eastern manuscripts join them.",
        how: "Built from Alap's and Taw's parts" }
    ]
  },

  /* Ligatures: two letters drawn as one, always on, where the second
     letter ends the word. */
  {
    char: "ܬܐ", name: "Taw–Alap", glyph: "taw-syriac_alaph-syriac", status: "drafting",
    summary: "Taw and a word-final Alap as one shape, the Alap stem crossing Taw. Always on in Eden; in Ramsina this twined form is optional (Stylistic Set 2), and its default keeps the two letters apart."
  },
  {
    char: "ܗܝ", name: "He–Yudh", glyph: "he-syriac_yudh-syriac", status: "drafting",
    summary: "He and a word-final Yudh as one shape. Always on in Eden; optional in Ramsina (Stylistic Set 3) and Ctesiphon."
  },
  {
    char: "ܨܢ", name: "Sadhe–Nun", glyph: "sadhe-syriac_nun-syriac", status: "drafting",
    summary: "Sadhe and a word-final Nun as one shape. Always on in Eden; optional in Ramsina (Stylistic Set 4)."
  }
];
