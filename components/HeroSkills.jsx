/* HeroSkills — tiny toolbelt chips, directly below the Hero metadata.
   Pure presentational, same pattern as HeroMetadata: data arrives via
   props from lib/profile.js (site-owned `skills`), never hardcoded.
   Informational only — plain list items, not buttons or links. Dots
   are decorative (aria-hidden). Entrance rides the same
   body[data-state="ready"] gate as the Hero boot reveals (see
   globals.css chip-in): per-chip --i drives the left → right stagger,
   no animation library involved. */

export default function HeroSkills({ skills }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;
  return (
    <ul className="hero__skills" aria-label="Tools and skills">
      {skills.map((skill, i) => (
        <li
          key={skill.name}
          className="hero__skill"
          style={{ "--dot": skill.color, "--i": i }}
        >
          <i aria-hidden="true" />
          {skill.name}
        </li>
      ))}
    </ul>
  );
}
