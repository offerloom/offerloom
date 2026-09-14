"use client";

import { useEffect, useState } from "react";
import { COMMUNITY } from "../lib/site";
import DealFloatLinks from "./DealFloatLinks";

export default function DealAlertsFloat() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > 140);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <aside
      className={`dealAlertsFloat${visible ? " is-visible" : ""}`}
      aria-label="Join OfferLoom deal alerts"
      aria-hidden={!visible}
    >
      <div className="dealAlertsFloatInner">
        <p className="dealAlertsFloatText">
          <span className="dealAlertsSpark" aria-hidden="true">✦</span>
          {COMMUNITY.hook}
        </p>
        <DealFloatLinks />
      </div>
    </aside>
  );
}
