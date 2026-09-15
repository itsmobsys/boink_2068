/* VibeSource — JSON presentation (presentational, no hooks).
   Rendered from `vibe.data` token-by-token: real text (readable to
   assistive tech), syntax color hierarchy, line-number gutter.
   The parent stage drives illumination purely through CSS
   (`data-phase`), so this file ships zero interaction logic. */

// Flatten the data object into styled lines. Handles scalar strings
// and string arrays — the full extent of the vibe schema.
function tokenize(data) {
  const lines = [{ depth: 0, tokens: [{ t: "punct", v: "{" }] }];
  const entries = Object.entries(data);
  entries.forEach(([key, value], i) => {
    const comma = i < entries.length - 1 ? "," : "";
    if (Array.isArray(value)) {
      lines.push({
        depth: 1,
        tokens: [
          { t: "key", v: JSON.stringify(key) },
          { t: "punct", v: ": [" },
        ],
      });
      value.forEach((item, j) => {
        lines.push({
          depth: 2,
          tokens: [
            { t: "str", v: JSON.stringify(item) },
            { t: "punct", v: j < value.length - 1 ? "," : "" },
          ],
        });
      });
      lines.push({ depth: 1, tokens: [{ t: "punct", v: "]" + comma }] });
    } else {
      lines.push({
        depth: 1,
        tokens: [
          { t: "key", v: JSON.stringify(key) },
          { t: "punct", v: ": " },
          { t: "str", v: JSON.stringify(value) },
          { t: "punct", v: comma },
        ],
      });
    }
  });
  lines.push({ depth: 0, tokens: [{ t: "punct", v: "}" }] });
  return lines;
}

export default function VibeSource({ data }) {
  const lines = tokenize(data);
  return (
    <div className="vibe-source">
      {lines.map((line, i) => (
        <div className="vibe-source__line" style={{ "--i": i }} key={i}>
          <span className="vibe-source__gutter" aria-hidden="true">
            {i + 1}
          </span>
          <code className="vibe-source__code" style={{ "--depth": line.depth }}>
            {line.tokens.map((tok, j) => (
              <span className={`vibe-source__${tok.t}`} key={j}>
                {tok.v}
              </span>
            ))}
          </code>
        </div>
      ))}
    </div>
  );
}
