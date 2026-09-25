const MOTES = [
  { left: "8%", top: "24%", size: 2, delay: "-2.5s", duration: "14s" },
  { left: "17%", top: "71%", size: 1, delay: "-8s", duration: "18s" },
  { left: "29%", top: "38%", size: 2, delay: "-11s", duration: "16s" },
  { left: "42%", top: "18%", size: 1, delay: "-5s", duration: "20s" },
  { left: "56%", top: "64%", size: 2, delay: "-14s", duration: "15s" },
  { left: "68%", top: "29%", size: 1, delay: "-7s", duration: "19s" },
  { left: "77%", top: "76%", size: 2, delay: "-17s", duration: "17s" },
  { left: "88%", top: "43%", size: 1, delay: "-3s", duration: "21s" },
  { left: "93%", top: "19%", size: 2, delay: "-10s", duration: "16s" },
  { left: "63%", top: "88%", size: 1, delay: "-13s", duration: "22s" },
];

const WIRES = [
  {
    className: "di-ambient__wire--one",
    d: "M-80 650 C 180 470 300 760 560 540 S 980 250 1520 430",
  },
  {
    className: "di-ambient__wire--two",
    d: "M-100 280 C 210 430 420 110 690 300 S 1110 720 1510 540",
  },
  {
    className: "di-ambient__wire--three",
    d: "M120 850 C 390 680 470 900 760 700 S 1160 470 1390 690",
  },
];

/**
 * AmbientSignal is a decorative, fixed-depth layer that gives the page a
 * quiet sense of motion without competing with the profile content. All
 * positions are deterministic so the server and client render identically.
 */
export function AmbientSignal() {
  return (
    <div className="di-ambient" aria-hidden="true">
      <div className="di-ambient__aurora di-ambient__aurora--violet" />
      <div className="di-ambient__aurora di-ambient__aurora--mint" />
      <div className="di-ambient__mesh" />

      <div className="di-ambient__wireframe">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" focusable="false">
          {WIRES.map((wire) => (
            <path key={wire.d} className={`di-ambient__wire ${wire.className}`} d={wire.d} />
          ))}
          <circle className="di-ambient__node di-ambient__node--one" cx="178" cy="546" r="3" />
          <circle className="di-ambient__node di-ambient__node--two" cx="694" cy="316" r="2.5" />
          <circle className="di-ambient__node di-ambient__node--three" cx="1106" cy="472" r="3" />
        </svg>
      </div>

      <div className="di-ambient__orbit di-ambient__orbit--one" />
      <div className="di-ambient__orbit di-ambient__orbit--two" />
      <div className="di-ambient__beam" />

      <div className="di-ambient__motes">
        {MOTES.map((mote) => (
          <span
            key={`${mote.left}-${mote.top}`}
            className="di-ambient__mote"
            style={{
              left: mote.left,
              top: mote.top,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              animationDelay: mote.delay,
              animationDuration: mote.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
