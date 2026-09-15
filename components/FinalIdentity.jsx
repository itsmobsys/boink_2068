/* FinalIdentity — the Step 1 motif, stripped down (server, no hooks).
   A small static echo of the hero avatar tile: same gradient tile
   language, same accent halo, monogram (or real image once wired).
   No parallax, no sheen tracking — the loop closing, quietly. */

export default function FinalIdentity({ displayName, avatarUrl }) {
  const monogram = ((displayName || "—").trim().charAt(0) || "—").toUpperCase();

  return (
    <div className="final-mark">
      <span className="final-mark__halo" aria-hidden="true" />
      <span className="final-mark__tile">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="final-mark__img" src={avatarUrl} alt="" aria-hidden="true" />
        ) : (
          <span className="final-mark__monogram" aria-hidden="true">
            {monogram}
          </span>
        )}
        <span className="final-mark__sheen" aria-hidden="true" />
        <span className="final-mark__border" aria-hidden="true" />
      </span>
      <span className="final-mark__name">[ {displayName} ]</span>
    </div>
  );
}
