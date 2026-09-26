type ArtworkKind = "denim" | "bag" | "beauty" | "jewellery" | "perfume" | "haircare" | "saree" | "watch" | "sport" | "fashion";

const themes: Record<ArtworkKind, { label: string; className: string }> = {
  denim: { label: "Denim edit", className: "ajioArt-denim" },
  bag: { label: "Bag edit", className: "ajioArt-bag" },
  beauty: { label: "Beauty edit", className: "ajioArt-beauty" },
  jewellery: { label: "Jewellery edit", className: "ajioArt-jewellery" },
  perfume: { label: "Fragrance edit", className: "ajioArt-perfume" },
  haircare: { label: "Haircare edit", className: "ajioArt-haircare" },
  saree: { label: "Saree edit", className: "ajioArt-saree" },
  watch: { label: "Watch edit", className: "ajioArt-watch" },
  sport: { label: "Activewear edit", className: "ajioArt-sport" },
  fashion: { label: "Style edit", className: "ajioArt-fashion" },
};

function artworkKind(title: string): ArtworkKind {
  const value = title.toLowerCase();
  if (/handbag/.test(value)) return "bag";
  if (/moistur|cream/.test(value)) return "beauty";
  if (/necklace|pendant/.test(value)) return "jewellery";
  if (/perfume|cologne/.test(value)) return "perfume";
  if (/shampoo|conditioner/.test(value)) return "haircare";
  if (/saree/.test(value)) return "saree";
  if (/timex/.test(value)) return "watch";
  if (/jean|trouser|pant|buda/.test(value)) return "denim";
  if (/puma|woodland/.test(value)) return "sport";
  return "fashion";
}

export default function AjioOfferArtwork({ title }: { title: string }) {
  const theme = themes[artworkKind(title)];
  return <div className={`ajioOfferArt ${theme.className}`} aria-hidden="true">
    <svg viewBox="0 0 240 112" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="190" cy="18" r="38" fill="currentColor" opacity=".12" />
      <circle cx="41" cy="104" r="44" fill="currentColor" opacity=".09" />
      <path d="M0 88C45 72 62 104 108 85C150 67 183 79 240 54V112H0V88Z" fill="currentColor" opacity=".12" />
      <path d="M30 24h20M40 14v20M194 78h16M202 70v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45" />
      <g className="ajioArtItem" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {theme.className === "ajioArt-bag" && <><path d="M89 45h62l7 49H82l7-49Z" fill="white" fillOpacity=".82"/><path d="M102 47V38a18 18 0 0 1 36 0v9"/><path d="M82 60h76" opacity=".55"/></>}
        {theme.className === "ajioArt-denim" && <><path d="m91 27 57 4-6 67-22-3-4-36-9 36-23 1 2-69Z" fill="white" fillOpacity=".82"/><path d="m95 43 48 3M117 32l-2 26m15-25 1 25" opacity=".55"/></>}
        {theme.className === "ajioArt-beauty" && <><path d="M98 38h43l6 57H92l6-57Z" fill="white" fillOpacity=".84"/><path d="M108 26h23v12h-23zM113 18h13v8h-13z" fill="white"/><path d="M103 61h33M105 68h28" opacity=".55"/></>}
        {theme.className === "ajioArt-jewellery" && <><path d="M92 33c0 33 10 51 29 59 19-8 29-26 29-59"/><path d="m113 82 8 12 8-12-8-8-8 8Z" fill="white" fillOpacity=".9"/><path d="M97 43c6 23 14 34 24 39 10-5 18-16 24-39" opacity=".52"/></>}
        {theme.className === "ajioArt-perfume" && <><path d="M99 41h43l7 54H92l7-54Z" fill="white" fillOpacity=".84"/><path d="M108 31h25v10h-25zM114 22h13v9h-13z" fill="white"/><path d="M105 62h31" opacity=".55"/></>}
        {theme.className === "ajioArt-haircare" && <><path d="M101 34h40l6 61H95l6-61Z" fill="white" fillOpacity=".84"/><path d="M105 26h32v8h-32zM111 19h20v7h-20z" fill="white"/><path d="M106 61h30m-29 8h28" opacity=".55"/></>}
        {theme.className === "ajioArt-saree" && <><path d="m101 27 28 6 21 60-31 4-24-48 6-22Z" fill="white" fillOpacity=".84"/><path d="m105 40 26 50m-31-38 39 8m-33 3 39 8" opacity=".55"/></>}
        {theme.className === "ajioArt-watch" && <><path d="M108 20h26l5 20h-36l5-20Zm0 72h26l5-20h-36l5 20Z" fill="white" fillOpacity=".7"/><rect x="94" y="38" width="54" height="36" rx="12" fill="white" fillOpacity=".88"/><circle cx="121" cy="56" r="11"/><path d="m121 56 7-6m-7 6-5-7"/></>}
        {theme.className === "ajioArt-sport" && <><path d="M85 69c14 0 25-5 33-22l14 8c5 11 12 17 24 21l-1 13H85V69Z" fill="white" fillOpacity=".86"/><path d="m111 60 18 5m-22 1 20 5m-26 0h-9" opacity=".55"/></>}
        {theme.className === "ajioArt-fashion" && <><path d="m107 30 14 8 14-8 18 17-13 13-6-6v39H95V54l-6 6-13-13 18-17 13 8Z" fill="white" fillOpacity=".86"/><path d="M111 35c1 10 4 15 10 15s9-5 10-15m-34 27h48" opacity=".55"/></>}
      </g>
      <circle cx="174" cy="70" r="3" fill="currentColor" opacity=".65" />
      <circle cx="187" cy="82" r="2" fill="currentColor" opacity=".5" />
    </svg>
    <span>{theme.label}</span>
  </div>;
}
