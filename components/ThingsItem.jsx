/* ThingsItem — one recurring behavior (server component, no hooks).
   A single row in the editorial index: index number, monospace label,
   display title, short description, tiny annotation. Hover / focus /
   active responses are pure CSS — keyboard and touch get the same
   treatment with zero JavaScript. */

export default function ThingsItem({ item, position }) {
  return (
    <li className="thing" style={{ "--i": position }} tabIndex={0}>
      <span className="thing__bar" aria-hidden="true" />
      <span className="thing__index" aria-hidden="true">
        {item.index}
      </span>
      <div className="thing__main">
        <p className="thing__label">{item.label}</p>
        <h3 className="thing__title">{item.title}</h3>
        <p className="thing__description">{item.description}</p>
        <p className="thing__detail">
          <span aria-hidden="true">— </span>
          {item.detail}
        </p>
      </div>
      <span className="thing__marker" aria-hidden="true" />
    </li>
  );
}
