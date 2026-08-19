export function AlchemyOrbit() {
  return (
    <div className="alchemy-orbit" aria-hidden="true">
      <svg viewBox="0 0 600 600" fill="none">
        <circle className="orbit-line orbit-line--outer" cx="300" cy="300" r="238" />
        <circle className="orbit-line" cx="300" cy="300" r="166" />
        <circle className="orbit-line orbit-line--inner" cx="300" cy="300" r="78" />
        <ellipse
          className="orbit-line orbit-line--tilted"
          cx="300"
          cy="300"
          rx="238"
          ry="78"
        />
        <path className="orbit-line" d="M300 62 506 419H94L300 62Z" />
        <path className="orbit-line" d="m300 538-206-357h412L300 538Z" />
        <circle className="orbit-node" cx="300" cy="62" r="7" />
        <circle className="orbit-node" cx="506" cy="419" r="7" />
        <circle className="orbit-node" cx="94" cy="419" r="7" />
        <circle className="orbit-core" cx="300" cy="300" r="18" />
        <path className="orbit-axis" d="M300 18v564M18 300h564" />
      </svg>
      <span className="alchemy-orbit__label alchemy-orbit__label--north">Clarity</span>
      <span className="alchemy-orbit__label alchemy-orbit__label--east">Care</span>
      <span className="alchemy-orbit__label alchemy-orbit__label--west">Rhythm</span>
    </div>
  );
}
