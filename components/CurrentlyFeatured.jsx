/* CurrentlyFeatured — the primary visual (server component, no hooks).
   One state dominates: large display statement, mono label with a
   live-feel indicator, quiet state line. Hover/focus response is
   pure CSS — no JavaScript. */

export default function CurrentlyFeatured({ featured }) {
  return (
    <div className="cur-featured" tabIndex={0}>
      <p className="cur-featured__label">
        <span className="cur-featured__dot" aria-hidden="true" />
        {featured.label}
      </p>
      <p className="cur-featured__statement">{featured.statement}</p>
      <p className="cur-featured__state">{featured.state}</p>
    </div>
  );
}
