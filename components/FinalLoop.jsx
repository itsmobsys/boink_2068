/* FinalLoop — one loop, not random sections (server, no hooks).
   The whole page as a single chain, ending where it began. The final
   node glows accent: END → BEGIN AGAIN. Separators decorative. */

export default function FinalLoop({ steps }) {
  return (
    <p className="final-loop">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <span className="final-loop__item" key={`${step}-${i}`}>
            {i > 0 && (
              <span className="final-loop__sep" aria-hidden="true">
                →
              </span>
            )}
            <span className={last ? "final-loop__node final-loop__node--return" : "final-loop__node"}>
              {step}
            </span>
          </span>
        );
      })}
    </p>
  );
}
