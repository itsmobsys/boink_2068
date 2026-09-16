/* HeroMetadata — pure presentational, server-rendered.
   Real values from lib/profile.js: Discord identity, account age
   (from the snowflake), badge count (identify-scope flags), and the
   live Gateway presence (dot + text, so color is never the signal). */

export default function HeroMetadata({ metaAccount, metaBadges, presence }) {
  const status = presence?.status || "unavailable";
  const label = presence?.label || "UNAVAILABLE";
  const longLabel = presence?.longLabel || "Status unavailable";
  return (
    <div className="hero__meta reveal" style={{ "--d": "0.78s" }} aria-label="Identity metadata">
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
      <span className="hero__meta-sep" aria-hidden="true">
        ·
      </span>
      <span
        className="hero__meta-item hero__meta-item--presence"
        data-status={status}
        title={`Discord status: ${longLabel}`}
      >
        <i aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}
