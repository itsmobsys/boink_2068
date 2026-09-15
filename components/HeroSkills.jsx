/* HeroSkills — tiny toolbelt chips, directly below the Hero metadata.
   Pure presentational, same pattern as HeroMetadata: data arrives via
   props from lib/profile.js (site-owned `skills`), never hardcoded.
   Informational only — plain list items, not buttons or links. Dots
   are decorative (aria-hidden); the reveal delay slots the row just
   after the metadata in the existing Hero boot sequence. */

export default function HeroSkills({ skills }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;
  return (
    <ul className="hero__skills reveal" style={{ "--d": "0.98s" }} aria-label="Tools and skills">
      {skills.map((skill) => (
        <li
          key={skill.name}
          className="hero__skill"
          style={{ "--dot": skill.color }}
        >
          <i aria-hidden="true" />
          {skill.name}
        </li>
      ))}
    </ul>
  );
}
