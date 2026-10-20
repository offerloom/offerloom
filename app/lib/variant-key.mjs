// Groups colour variants of the same product: same title once colour words are removed, same price.
const COLOURS = "black|white|blue|navy|red|green|olive|grey|gray|silver|gold|golden|rose|pink|purple|violet|lavender|lilac|yellow|orange|beige|cream|ivory|brown|tan|maroon|wine|teal|turquoise|aqua|mint|peach|coral|charcoal|graphite|midnight|space|jet|matte|metallic|carbon|onyx|pearl|bronze|copper|champagne|khaki|mustard|multicolou?r|multi|transparent|clear|camo|camouflage|sky|light|dark|deep|pastel|neon|candy|ocean|forest|cosmic|stealth|starlight|sunset|frost|ice|snow|ash|slate|steel|denim|plum|magenta|burgundy|indigo|emerald|ruby|sapphire|jade";
const COLOUR_WORD = new RegExp(`\\b(${COLOURS})\\b`, "gi");

export function variantName(name) {
  return String(name).toLowerCase()
    .replace(/\(([^)]*)\)/g, (match, inner) => (inner.replace(COLOUR_WORD, "").replace(/[^a-z0-9]+/g, "").length <= 2 ? " " : match))
    .replace(/\b(colou?r|shade)\s*[:-]?\s*\w+/g, " ")
    .replace(COLOUR_WORD, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Same base title + same lowest price (paise) → same card. Different price → separate card. */
export function variantKey(name, price) {
  return `${variantName(name)}|${price ?? "noprice"}`;
}
