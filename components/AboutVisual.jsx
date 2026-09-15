/* AboutVisual — subtle abstract identity mark (server, zero JS).
   A specimen plate: thin borders, faint grid, orbit ring, glowing
   core, corner annotations. The light sweep runs once when the
   parent Reveal fires — pure CSS, no looping, no runtime cost. */

export default function AboutVisual({ visual }) {
  return (
    <figure className="about-visual" aria-hidden="true">
      <div className="about-visual__plate">
        <span className="about-visual__tag about-visual__tag--tl">{visual.figure}</span>
        <span className="about-visual__tag about-visual__tag--br">{visual.signature}</span>
        <span className="about-visual__ring" />
        <span className="about-visual__core" />
        <span className="about-visual__sweep" />
        <span className="about-visual__tick about-visual__tick--tl" />
        <span className="about-visual__tick about-visual__tick--tr" />
        <span className="about-visual__tick about-visual__tick--bl" />
        <span className="about-visual__tick about-visual__tick--br" />
      </div>
      <figcaption className="about-visual__caption">{visual.caption}</figcaption>
    </figure>
  );
}
