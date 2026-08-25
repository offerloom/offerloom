export type CjFeedRow = {
  advertiserId: string;
  advertiserName: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  affiliateUrl: string;
  imageUrl: string;
  currency: string;
  price: string;
  availability: string;
};

export type ParsedCjFeed = {
  rows: CjFeedRow[];
  skipped: number;
  errors: string[];
};

const REQUIRED_HEADERS = [
  "advertiser_id",
  "advertiser_name",
  "sku",
  "name",
  "brand",
  "category",
  "description",
  "affiliate_url",
  "image_url",
  "currency",
  "price",
  "availability",
] as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCjFixtureCsv(csv: string): ParsedCjFeed {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CJ fixture CSV must include a header row and at least one data row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`CJ fixture CSV is missing required columns: ${missing.join(", ")}`);
  }

  const indexByHeader = Object.fromEntries(headers.map((header, index) => [header, index]));
  const rows: CjFeedRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  lines.slice(1).forEach((line, offset) => {
    const rowNumber = offset + 2;
    const values = parseCsvLine(line);
    const read = (header: typeof REQUIRED_HEADERS[number]) => values[indexByHeader[header]] ?? "";

    const row: CjFeedRow = {
      advertiserId: read("advertiser_id"),
      advertiserName: read("advertiser_name"),
      sku: read("sku"),
      name: read("name"),
      brand: read("brand"),
      category: read("category"),
      description: read("description"),
      affiliateUrl: read("affiliate_url"),
      imageUrl: read("image_url"),
      currency: read("currency"),
      price: read("price"),
      availability: read("availability"),
    };

    if (!row.advertiserId || !row.sku || !row.name || !row.affiliateUrl) {
      errors.push(`Row ${rowNumber}: advertiser_id, sku, name and affiliate_url are required.`);
      skipped += 1;
      return;
    }

    if (!row.affiliateUrl.startsWith("https://")) {
      errors.push(`Row ${rowNumber}: affiliate_url must use HTTPS.`);
      skipped += 1;
      return;
    }

    if (row.description.length < 20) {
      errors.push(`Row ${rowNumber}: description must be at least 20 characters for OfferLoom summaries.`);
      skipped += 1;
      return;
    }

    rows.push(row);
  });

  return { rows, skipped, errors };
}
