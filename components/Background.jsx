/* Background layers — pure presentational, server-rendered.
   Dark room, single subject lit. No giant full-screen gradient. */

export default function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg__base" />
      <div className="bg__core-light" />
      <div className="bg__accent-wash" />
      <div className="bg__avatar-halo" />
      <div className="bg__grid-fade" />
      <div className="bg__grain" />
      <div className="bg__vignette" />
    </div>
  );
}
