/* CurrentlyFeatured — the primary visual (server component, no hooks).
   One state dominates: large display statement, mono label with a
   live-feel indicator, quiet state line. Every hover/focus response is
   pure CSS; the only JavaScript is PointerGlow, the shared decorative
   light that makes the panel read as a surface with depth rather than
   a flat card. It sits under the content and is disabled on touch and
   under reduced motion. */

import PointerGlow from "./PointerGlow";
import SplitText from "./SplitText";

export default function CurrentlyFeatured({ featured }) {
  return (
    <div className="cur-featured" tabIndex={0} data-glow>
      <PointerGlow />
      <p className="cur-featured__label">
        <span className="cur-featured__dot" aria-hidden="true" />
        {featured.label}
      </p>
      <p className="cur-featured__statement">
        <SplitText text={featured.statement} />
      </p>
      <p className="cur-featured__state">{featured.state}</p>
    </div>
  );
}
