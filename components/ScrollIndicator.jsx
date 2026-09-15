/* ScrollIndicator — pure presentational, server-rendered.
   Elegant text interaction, gently animated via CSS. */

export default function ScrollIndicator() {
  return (
    <div className="scroll-hint reveal" style={{ "--d": "1.05s" }} aria-hidden="true">
      <span className="scroll-hint__text">Scroll to explore</span>
      <span className="scroll-hint__arrow">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1.5V10.5M6 10.5L2.5 7M6 10.5L9.5 7"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
