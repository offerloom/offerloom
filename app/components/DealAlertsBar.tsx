import { COMMUNITY } from "../lib/site";
import DealJoinLinks from "./DealJoinLinks";

export default function DealAlertsBar() {
  return (
    <section className="dealAlertsBar" aria-label="Join OfferLoom deal alerts">
      <div className="dealAlertsInner">
        <p className="dealAlertsHook">
          <span className="dealAlertsSpark" aria-hidden="true">✦</span>
          {COMMUNITY.hook}
        </p>
        <DealJoinLinks />
      </div>
    </section>
  );
}
