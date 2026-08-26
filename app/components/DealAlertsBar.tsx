import { COMMUNITY } from "../lib/site";

export default function DealAlertsBar() {
  return (
    <section className="dealAlertsBar" aria-label="Join OfferLoom deal alerts">
      <p className="dealAlertsQuote">“{COMMUNITY.quote}”</p>
      <div className="dealAlertsGrid">
        <a className="dealAlert dealAlert-whatsapp" href={COMMUNITY.whatsapp.url} target="_blank" rel="noopener noreferrer">
          <span className="dealAlertIcon" aria-hidden="true">✆</span>
          <span className="dealAlertCopy">
            <strong>{COMMUNITY.whatsapp.headline}</strong>
            <small>{COMMUNITY.whatsapp.subtext}</small>
          </span>
          <span className="dealAlertCta">{COMMUNITY.whatsapp.cta}</span>
        </a>
        <a className="dealAlert dealAlert-telegram" href={COMMUNITY.telegram.url} target="_blank" rel="noopener noreferrer">
          <span className="dealAlertIcon" aria-hidden="true">✈</span>
          <span className="dealAlertCopy">
            <strong>{COMMUNITY.telegram.headline}</strong>
            <small>{COMMUNITY.telegram.subtext}</small>
          </span>
          <span className="dealAlertCta">{COMMUNITY.telegram.cta}</span>
        </a>
      </div>
    </section>
  );
}
