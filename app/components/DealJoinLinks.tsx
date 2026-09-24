import { COMMUNITY } from "../lib/site";

type DealJoinLinksProps = {
  className?: string;
};

export default function DealJoinLinks({ className }: DealJoinLinksProps) {
  return (
    <div className={className ? `dealAlertsActions ${className}` : "dealAlertsActions"}>
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
      <a
        className="dealJoin dealJoin-telegram"
        href={COMMUNITY.telegram.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="dealJoinIcon" aria-hidden="true">✈</span>
        <span className="dealJoinCopy">
          <strong>{COMMUNITY.telegram.buttonText}</strong>
          <small>{COMMUNITY.telegram.via}</small>
        </span>
      </a>
    </div>
  );
}
