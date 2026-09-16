/* ThingsList — the vertical editorial index (server component).
   One continuous composition, not a card grid: plain <ol> / <li> so
   the markup stays valid and semantic. Entries reveal progressively
   via CSS keyed off the single wrapping Reveal — this file ships
   no JavaScript. */

import Reveal from "./Reveal";
import ThingsItem from "./ThingsItem";

export default function ThingsList({ items }) {
  return (
    <Reveal delay="0.2s" className="things__reveal">
      <ol className="things__list">
        {items.map((item, i) => (
          <ThingsItem key={item.index} item={item} position={i} />
        ))}
      </ol>
    </Reveal>
  );
}
