export function publicOffer(payload: unknown, now = Date.now()): {price:number;mrp:number|null;checkedAt:string} | null {
  try {
    const offer = JSON.parse(String(payload));
    const age = now - Date.parse(offer.checkedAt);
    if (!Number.isFinite(age) || age < 0 || age > 86400000 || !Number.isSafeInteger(offer.price) || offer.price <= 0) return null;
    if (offer.mrp !== null && (!Number.isSafeInteger(offer.mrp) || offer.mrp < offer.price)) return null;
    return { price: offer.price, mrp: offer.mrp, checkedAt: offer.checkedAt };
  } catch { return null; }
}
