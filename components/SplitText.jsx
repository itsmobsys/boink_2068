/* SplitText — word-cascade for short, plain-colour copy (server, zero JS).
   Each word is an inline-block span carrying its own position index; the
   shared .reveal-scroll.is-visible state in globals.css cascades them
   BOTTOM → TOP, a beat behind the block they sit in. No hooks, no
   measuring, no per-word observers, no animation library — the words
   animate once and then rest at opacity 1 / no transform / no filter, so
   text is always fully crisp after entrance.

   Scope: lead sentences only (the line that opens a section). Supporting
   paragraphs keep the block reveal so the page never turns into a wall of
   individually animating elements.

   Not for headings painted with `background-clip: text`: their gradient
   lives on the parent, so fading child spans would leave the gradient
   visible. Headings reveal as blocks instead. */

export default function SplitText({ text, className = "" }) {
  const words = String(text ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return <span className={className}>{text}</span>;

  return (
    <span className={`split${className ? " " + className : ""}`}>
      {words.flatMap((word, i) => [
        // real text nodes keep the spaces — assistive tech reads the
        // sentence as one continuous string, not word fragments
        i > 0 ? " " : null,
        <span className="split__word" style={{ "--wi": i }} key={`${i}-${word}`}>
          {word}
        </span>,
      ])}
    </span>
  );
}
