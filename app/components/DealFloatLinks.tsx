import { COMMUNITY } from "../lib/site";

export default function DealFloatLinks() {
  return (
    <div className="dealAlertsActions">
      <a
        className="dealJoin dealJoin-facebook"
        href={COMMUNITY.facebook.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="dealJoinIcon" aria-hidden="true">f</span>
        <span className="dealJoinCopy">
          <strong>{COMMUNITY.facebook.buttonText}</strong>
          <small>{COMMUNITY.facebook.via}</small>
        </span>
      </a>
    </div>
  );
}
