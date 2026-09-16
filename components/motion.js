/* motion — viewport observation + shared scroll state for the site.
   One IntersectionObserver hooking reveals (class only), one for scene
   continuity, one for viewport phases, and ONE scroll listener
   publishing shared scroll state — never one observer/listener per
   element. Wrapper entrances themselves are motion/react (see
   Reveal.jsx): classic scroll-triggered BOTTOM → TOP, opacity 0 /
   y 48 / blur 14px → opacity 1 / y 0 / blur 0px, ~0.7s premium
   ease-out, viewport once, ~100ms stagger. This module's reveal
   observer only adds .is-visible for descendant CSS cascades; it owns
   no entrance motion. No mouse, scroll-linked, parallax or looping
   motion for reveals. */

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* Reveal hook — fires ON entry, not before: a negative bottom margin
   shrinks the intersection area above the fold edge, so the callback
   runs only once the element has actually crossed into the viewport.
   Since the motion/react cutover (see Reveal.jsx) this observer owns
   NO entrance animation of its own: it only adds .is-visible, which
   triggers descendant CSS cascades (Things rows, Currently states,
   Vibe source lines, word cascades). Wrapper entrances are motion's
   whileInView with matching viewport settings. */
const REVEAL_OPTS = { threshold: 0.15, rootMargin: "0px 0px -5% 0px" };

let revealIO = null;

export function observeReveal(el) {
  if (!el) return () => {};
  if (prefersReducedMotion()) {
    el.classList.add("is-visible");
    return () => {};
  }
  if (!revealIO) {
    revealIO = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target); // entrances play once, then rest
        }
      }
    }, REVEAL_OPTS);
  }
  revealIO.observe(el);
  return () => {
    if (revealIO) revealIO.unobserve(el);
  };
}

/* Scene continuity — one observer for hero + all sections.
   Each [data-scene] element reports two independent states:
   - is-inview: entered the viewport at least once (sticky; drives
     hairline draws and other arrival continuity, never removed)
   - is-past: currently sitting fully above the viewport (live; drives
     the extremely subtle exit dimming, removed on return)
   The hero additionally publishes body[data-scene] so the background
   lighting can quietly lose intensity once the first scene is past. */

/* Viewport phases — continuous-feel scroll motion for the Vibe deck.
   A THIRD shared observer (still no scroll listeners, no libraries).
   Each watched pane is classified every crossing from its live rect:
   - vp-below  entering: approaching from below the fold
   - vp-center near the viewport center: full presence
   - vp-above  leaving: drifting past above the fold
   CSS transitions (long, eased) interpolate between phases, so normal
   scrolling reads as one continuous glide rather than stepped states.
   Threshold steps give regular updates mid-scroll; the rect math (not
   the ratios) decides the phase, with a 2px grace matching the scene
   observer so fractional glide settles can't stick between states. */
let phaseIO = null;
const PHASE_STATES = ["vp-below", "vp-center", "vp-above"];

function phaseFor(rect) {
  const vh = window.innerHeight || 800;
  if (rect.bottom < vh * 0.35) return "vp-above";
  if (rect.top > vh * 0.65) return "vp-below";
  return "vp-center";
}

export function observeViewportPhase(el) {
  if (!el || typeof el.classList === "undefined") return () => {};
  if (prefersReducedMotion()) {
    // Reduced motion: rest at full presence, no observation needed.
    el.classList.add("vp-center");
    return () => {};
  }
  if (!phaseIO) {
    phaseIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const t = entry.target;
          const phase = phaseFor(entry.boundingClientRect);
          for (const s of PHASE_STATES) {
            if (s === phase) t.classList.add(s);
            else t.classList.remove(s);
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
  }
  phaseIO.observe(el);
  return () => {
    if (phaseIO) phaseIO.unobserve(el);
  };
}

/* ── shared scroll state (velocity defocus + hero handoff) ──
   ONE passive scroll listener + ONE rAF loop for the entire page.
   While the page is moving it publishes four inherited custom
   properties on <html>:
     --sblur      px of temporary defocus   (0 at rest)
     --sdepth     px of temporary drift     (0 at rest)
     --hero-out   0→1 hero exit progress    (0 at rest)
     --scroll-y   document position, unitless px, 4px steps
   plus the flag html[data-scroll-motion="on"]. Only gated layers in
   globals.css consume --sblur / --sdepth — section content, cards,
   decorative layers, the Source → Compile → Output panes — so
   navigation, focused controls and the compile button never soften.
   At rest the flag is REMOVED, which drops every filter entirely:
   nothing stays blurred, no layer keeps a filter, and text is always
   crisp at rest. Rise is smoothed, recovery is faster and short
   (~150ms), values stay deliberately low so text stays readable
   mid-scroll.

   The hero handoff and document position are shaped here rather than
   in CSS: they are positions, not velocities, so they stay exact when
   scrolling stops and cost nothing while idle. Every value is
   quantised, so on most frames the loop writes nothing at all — and
   it stops the moment nothing changes. Reduced motion: never installs
   and never publishes, so every consumer rests at its static state.

   Reads one scrollY per frame (no layout thrash, no writes outside
   the frame), and pauses completely when the tab is hidden. */

const BLUR_CAP = { wide: 1.1, narrow: 0.7 }; // px — subtle by design
const SPEED_REF = 34; // px per 60fps frame ≈ a brisk wheel scroll
const RISE = 0.26; // approach smoothing
const FALL = 0.36; // recovery smoothing (short, so text snaps crisp)
const quantise = (v) => Math.round(v * 4) / 4; // 0.25px grid
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

let scrollMotion = null;

export function initScrollMotion() {
  if (typeof window === "undefined") return () => {};
  if (scrollMotion) return scrollMotion;
  if (prefersReducedMotion()) {
    scrollMotion = () => {};
    return scrollMotion;
  }

  const root = document.documentElement;
  let raf = 0;
  let lastY = window.scrollY;
  let lastT = 0;
  let value = 0;
  let published = -1;
  let heroPub = -1;
  let yPub = -1;
  let gated = false;

  const gate = (on) => {
    if (on === gated) return false;
    gated = on;
    if (on) root.dataset.scrollMotion = "on";
    else delete root.dataset.scrollMotion;
    return true;
  };

  const frame = (t) => {
    raf = 0;
    const y = Math.max(0, window.scrollY);
    const dt = Math.max(8, Math.min(64, lastT ? t - lastT : 16)) / 16.67;
    lastT = t;
    const speed = Math.abs(y - lastY) / dt; // px per 60fps frame
    lastY = y;
    let wrote = false;

    const cap = window.innerWidth <= 900 ? BLUR_CAP.narrow : BLUR_CAP.wide;
    const target = speed < 1.5 ? 0 : cap * Math.min(1, speed / SPEED_REF);
    value += (target - value) * (target > value ? RISE : FALL);
    if (target === 0 && value < 0.02) value = 0;

    const px = quantise(value);
    if (px !== published) {
      published = px;
      root.style.setProperty("--sblur", px + "px");
      root.style.setProperty("--sdepth", (-px * 0.7).toFixed(2) + "px");
      wrote = true;
    }
    /* Hysteresis on the flag: it opens as soon as the blur is worth
       painting and closes only once the value is genuinely gone, so a
       gesture with an uneven frame delta cannot flicker a filter on and
       off. Both thresholds are far below one visible pixel. */
    if (gate(gated ? value > 0.04 : px > 0)) wrote = true;

    /* Hero handoff — the first viewport starts giving way once the
       page is a fifth of the way down and is fully retired by the
       time the About seam reaches the top. The curve lives here so
       CSS stays a plain multiply with no easing stack to fight. */
    const out = clamp01((y / (window.innerHeight || 800) - 0.18) / 0.82);
    const outQ = Math.round(out * 200) / 200;
    if (outQ !== heroPub) {
      heroPub = outQ;
      root.style.setProperty("--hero-out", String(outQ));
      wrote = true;
    }

    /* Document position in 4px steps: decorative scroll-linked layers
       (the About dial) read it instead of running an infinite loop. */
    const yQ = Math.round(y / 4) * 4;
    if (yQ !== yPub) {
      yPub = yQ;
      root.style.setProperty("--scroll-y", String(yQ));
      wrote = true;
    }

    if (value > 0 || wrote) {
      raf = requestAnimationFrame(frame);
    } else {
      lastT = 0; // next burst measures from a clean frame delta
    }
  };

  const kick = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const settle = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastT = 0;
    value = 0;
    published = 0;
    // re-anchor so a restored tab can't read as one huge scroll delta
    lastY = window.scrollY;
    root.style.setProperty("--sblur", "0px");
    root.style.setProperty("--sdepth", "0px");
    gate(false);
  };

  window.addEventListener("scroll", kick, { passive: true });
  document.addEventListener("visibilitychange", settle);

  scrollMotion = () => {
    window.removeEventListener("scroll", kick);
    document.removeEventListener("visibilitychange", settle);
    settle();
    scrollMotion = null;
  };
  return scrollMotion;
}

/* Same one-observer-per-concern contract as revealIO / phaseIO above.
   This declaration is load-bearing: the observer used to be assigned to
   an undeclared identifier, which threw a ReferenceError in strict mode
   (every bundle) the first time a scene node was observed. That error
   escaped SceneContinuity's effect and silently took everything wired
   after it with it — section hairlines, past-scene dimming, the
   body[data-scene] lighting handoff, the site-wide viewport glide and
   the shared scroll state. Declared here so the module can never
   regress into that state again. */
let sceneIO = null;

export function observeScene(el) {
  if (!el || typeof el.dataset === "undefined") return () => {};
  if (prefersReducedMotion()) {
    // Reduced motion: hairlines draw instantly via the resting state,
    // exit dimming and parallax never engage. No observer needed.
    el.classList.add("is-inview");
    return () => {};
  }
  if (!sceneIO) {
    // Top inset of 2px: smooth scrollIntoView glides settle on
    // fractional pixels (bottom: 0.14) — still "intersecting", so no
    // exit crossing would ever fire. The inset makes ≤2px slivers count
    // as exited (generating the crossing) and the matching tolerance
    // below confirms them as past. Entry behavior is unchanged.
    sceneIO = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const t = entry.target;
        const past = entry.boundingClientRect.bottom <= 2;
        if (past) {
          t.classList.add("is-past");
        } else {
          t.classList.remove("is-past");
          if (entry.isIntersecting) t.classList.add("is-inview");
        }
        if (t.dataset.scene === "hero" && document.body) {
          document.body.dataset.scene = past ? "beyond" : "hero";
        }
      }
    }, { threshold: 0, rootMargin: "-2px 0px 0px 0px" });
  }
  sceneIO.observe(el);
  return () => {
    if (sceneIO) sceneIO.unobserve(el);
  };
}
