/* HeroIdentity — pure presentational, server-rendered.
   displayName → headline · username → metadata · personalLine → understated. */

export default function HeroIdentity({ displayName, username, personalLine }) {
  return (
    <div className="hero__identity">
      <h1 className="hero__name reveal" style={{ "--d": "0.5s" }}>
        {displayName}
      </h1>
      <p className="hero__username reveal" style={{ "--d": "0.62s" }}>
        <span className="hero__username-at" aria-hidden="true">
          @
        </span>
        {username}
      </p>
      <p className="hero__line reveal" style={{ "--d": "0.74s" }}>
        {personalLine}
      </p>
    </div>
  );
}
