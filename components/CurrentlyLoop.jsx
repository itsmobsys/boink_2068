/* CurrentlyLoop — tiny repeating loop (server component, no hooks).
   A single-line echo of the Step 4 philosophy: thin separators,
   monospace, wraps naturally. Decorative arrows hidden from AT —
   the words alone carry the meaning. */

export default function CurrentlyLoop({ steps }) {
  return (
    <p className="cur-loop">
      {steps.map((step, i) => (
        <span className="cur-loop__item" key={`${step}-${i}`}>
          {i > 0 && (
            <span className="cur-loop__sep" aria-hidden="true">
              →
            </span>
          )}
          {step}
        </span>
      ))}
    </p>
  );
}
