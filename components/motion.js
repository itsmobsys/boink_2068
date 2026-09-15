/* motion — the single shared motion core for the whole site.
   One IntersectionObserver for reveals, one for scene continuity —
   never one observer per element, never scroll listeners, never an
   animation library. Motion language: content travels LEFT → RIGHT
   into place (horizontal + depth, never bottom → top), layered by
   depth (eyebrow / heading / content / deep / visual), staggered on
   a 65ms grid, settled with blur → crisp. All visuals live in
   globals.css; this module only owns viewport observation. */

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* Per-element reveals fire slightly BEFORE the element centers:
   a low threshold plus a small positive bottom margin means the
   entrance begins naturally while the section is still arriving. */
const REVEAL_OPTS = { threshold: 0.12, rootMargin: "0px 0px 6% 0px" };

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
