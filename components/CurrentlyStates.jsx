/* CurrentlyStates — supporting states (server component, no hooks).
   A vertical signal rail runs through the rows; each row carries a
   restrained geometric glyph (typography, never emoji). Hover/focus
   brightens the row and its node — pure CSS, keyboard included via
   tabIndex, screen readers get plain name/value text. */

export default function CurrentlyStates({ states }) {
  return (
    <ul className="cur-states">
      {states.map((state, i) => (
        <li className="cur-state" key={state.name} tabIndex={0} style={{ "--i": i }}>
          <span className="cur-state__node" aria-hidden="true" />
          <span className="cur-state__glyph" aria-hidden="true">
            {state.glyph}
          </span>
          <div className="cur-state__body">
            <p className="cur-state__name">{state.name}</p>
            <p className="cur-state__value">{state.value}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
