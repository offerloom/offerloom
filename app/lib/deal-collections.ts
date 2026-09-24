export function matchesCollection(approvedPayload: string | null, collectionKey: string): boolean {
  if (!approvedPayload) return false;
  try {
    const payload = JSON.parse(approvedPayload);
    const sources = payload.discoverySources ?? (payload.discoverySource ? [payload.discoverySource] : []);
    return Array.isArray(sources) && sources.includes(collectionKey);
  } catch {
    return false;
  }
}

export function matchesMerchant(merchant: string, merchantFilter?: string): boolean {
  return !merchantFilter || merchant === merchantFilter;
}

export function matchesDealListing(
  row: { merchant: string; approvedPayload: string | null },
  filters: { merchant?: string; collection?: string },
): boolean {
  return matchesMerchant(row.merchant, filters.merchant)
    && (!filters.collection || matchesCollection(row.approvedPayload, filters.collection));
}
