export type CsvProductRow = {
  amazonUrl: string;
  name: string;
  category: string;
  summary: string;
  specs: string;
  publish: boolean;
};

const REQUIRED_HEADERS = ["amazon_url", "name", "category", "summary"];

export function parseProductCsv(input: string): CsvProductRow[] {
  const records = parseCsv(input.replace(/^\uFEFF/, ""));
  if (records.length < 2) throw new Error("The CSV must include a header and at least one product row.");

  const headers = records[0].map((value) => value.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}.`);

  const index = (name: string) => headers.indexOf(name);
  return records.slice(1)
    .filter((record) => record.some((value) => value.trim()))
    .map((record) => ({
      amazonUrl: record[index("amazon_url")]?.trim() ?? "",
      name: record[index("name")]?.trim() ?? "",
      category: record[index("category")]?.trim() ?? "",
      summary: record[index("summary")]?.trim() ?? "",
      specs: index("specs") >= 0 ? record[index("specs")]?.trim() ?? "" : "",
      publish: index("publish") >= 0 && /^(true|yes|1|publish)$/i.test(record[index("publish")]?.trim() ?? ""),
    }));
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let position = 0; position < input.length; position += 1) {
    const character = input[position];
    if (character === '"') {
      if (quoted && input[position + 1] === '"') { field += '"'; position += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field); field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[position + 1] === "\n") position += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += character;
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
