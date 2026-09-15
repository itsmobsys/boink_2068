/* HeroMetadata — pure presentational, server-rendered.
   Real values from lib/profile.js: Discord identity, account age
   (from the snowflake), badge count (identify-scope flags). */

export default function HeroMetadata({ metaAccount, metaBadges }) {
  return (
    <div className="hero__meta reveal" style={{ "--d": "0.86s" }} aria-label="Identity metadata">
      <span className="hero__meta-item hero__meta-item--live">
        <i aria-hidden="true" />
        Discord
      </span>
      <span className="hero__meta-sep" aria-hidden="true">
        ·
      </span>
      <span className="hero__meta-item">{metaAccount}</span>
      <span className="hero__meta-sep" aria-hidden="true">
        ·
      </span>
      <span className="hero__meta-item">{metaBadges}</span>
    </div>
  );
}
