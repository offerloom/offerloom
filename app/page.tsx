"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Listing = { store: string; affiliateUrl?: string };
type Product = { id: string | number; icon: string; name: string; category: string; summary: string; specs: string[]; listings: Listing[]; detailPath?: string };
type ManagedProduct = { id: string; name: string; category: string; summary: string; specs: string[]; outboundPath: string; detailPath: string };

const amazonLinks = {
  electronics: "https://www.amazon.in/s?k=electronics&tag=offerloom-21",
  mobiles: "https://www.amazon.in/s?k=5g+phone+under+20000&linkCode=ll2&tag=offerloom-21&linkId=49807149200b7c8ffa3fe652d3e2734c&ref_=as_li_ss_tl",
  laptops: "https://www.amazon.in/s?k=16gb+ram+512gb+ssd+laptop&tag=offerloom-21",
  audio: "https://www.amazon.in/s?k=wireless+earbuds+with+anc&linkCode=ll2&tag=offerloom-21&linkId=57c27eff35deb2c3b2c1c4b1d796992d&ref_=as_li_ss_tl",
  televisions: "https://www.amazon.in/s?k=55+inch+4k+smart+tv&tag=offerloom-21",
  gaming: "https://www.amazon.in/s?k=gaming+console&tag=offerloom-21",
  appliances: "https://www.amazon.in/s?k=energy+efficient+refrigerator&tag=offerloom-21",
};

const products: Product[] = [
  { id: 1, icon: "▯", name: "5G phones under ₹20,000", category: "Mobiles", summary: "Explore current 5G phones suited to calls, photos and everyday streaming.", specs: ["5G", "128 GB options", "Large batteries"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.mobiles }] },
  { id: 2, icon: "▰", name: "Everyday performance laptops", category: "Laptops", summary: "Explore practical configurations for work, study and light creative tasks.", specs: ["16 GB options", "SSD storage", "15.6-inch options"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.laptops }] },
  { id: 3, icon: "◉", name: "Wireless earbuds with ANC", category: "Audio", summary: "Explore compact earbuds with noise cancellation and portable charging cases.", specs: ["ANC options", "Bluetooth", "Fast charge"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.audio }] },
  { id: 4, icon: "▣", name: "55-inch 4K smart televisions", category: "TVs", summary: "Explore large-screen televisions with current streaming and display features.", specs: ["4K UHD", "HDR options", "Smart TV"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.televisions }] },
  { id: 5, icon: "✣", name: "Current-generation game consoles", category: "Gaming", summary: "Explore living-room gaming systems with fast storage and wireless controls.", specs: ["Current generation", "4K options", "Wireless"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.gaming }] },
  { id: 6, icon: "⌂", name: "Energy-efficient refrigerators", category: "Appliances", summary: "Explore family-sized refrigerators focused on efficient everyday use.", specs: ["Frost-free options", "Convertible options", "Energy rated"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.appliances }] },
];

const categoryIcons: Record<string, string> = { Mobiles: "▯", Laptops: "▰", Audio: "◉", TVs: "▣", Gaming: "✣", Appliances: "⌂" };

export default function Home() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState("recommended");
  const [managedProducts, setManagedProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/products")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (!active) return;
        setManagedProducts(data.products.map((product: ManagedProduct) => ({
          id: product.id,
          icon: categoryIcons[product.category] ?? "◇",
          name: product.name,
          category: product.category,
          summary: product.summary,
          specs: product.specs,
          listings: [{ store: "Amazon", affiliateUrl: product.outboundPath }],
          detailPath: product.detailPath,
        })));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const allProducts = useMemo(() => [...managedProducts, ...products], [managedProducts]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(allProducts.map((product) => product.category)))], [allProducts]);
  const categoryCounts = useMemo(() => Object.fromEntries(categories.map((item) => [item, item === "All" ? allProducts.length : allProducts.filter((product) => product.category === item).length])), [allProducts, categories]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = allProducts.filter((product) => (category === "All" || product.category === category) && (!term || `${product.name} ${product.category} ${product.summary} ${product.specs.join(" ")}`.toLowerCase().includes(term)));
    if (sort === "name") return [...matches].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "category") return [...matches].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return matches;
  }, [allProducts, category, query, sort]);

  function search(event: FormEvent) {
    event.preventDefault();
    setQuery(draft);
    document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth" });
  }

  function chooseCategory(item: string) {
    setCategory(item);
    setQuery("");
    setDraft("");
    document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth" });
  }

  function reset() {
    setCategory("All");
    setQuery("");
    setDraft("");
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="OfferLoom home"><span className="brandMark">O</span><span>Offer<span>Loom</span></span></a>
      <nav aria-label="Main navigation"><a href="#catalog">Find products</a><a href="#categories">Categories</a><a href="#amazon-shop">Shop on Amazon</a><a href="#how">How it works</a></nav>
      <a className="alertButton" href="#catalog">Find a deal</a>
    </header>
    <p className="amazonDisclosure">As an Amazon Associate I earn from qualifying purchases.</p>

    <section className="hero" id="top">
      <div className="heroCopy">
        <span className="eyebrow">INDIA-FIRST ELECTRONICS SHOPPING</span>
        <h1>Find it faster.<br/><em>Shop with confidence.</em></h1>
        <p>Search useful electronics, narrow by category, and continue to an approved shopping destination when you are ready.</p>
        <form className="search" onSubmit={search}><span aria-hidden="true">⌕</span><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Search products" placeholder="Search phones, laptops, earbuds…"/><button>Find products</button></form>
        <div className="popularSearches"><span>Popular:</span><button onClick={() => { setDraft("5G phone"); setQuery("5G phone"); }}>5G phones</button><button onClick={() => { setDraft("laptop"); setQuery("laptop"); }}>Laptops</button><button onClick={() => { setDraft("earbuds"); setQuery("earbuds"); }}>Earbuds</button></div>
        <div className="trust"><span>✓ Clear categories</span><span>↗ Approved merchant links</span><span>₹ No extra cost to shoppers</span></div>
      </div>
      <div className="shoppingPanel" aria-label="Amazon shopping destination">
        <div className="panelBadge">AMAZON SHOPPING ENABLED</div><span className="panelIcon" aria-hidden="true">a→z</span><h2>Browse electronics on Amazon.in</h2><p>Use OfferLoom’s approved affiliate destination to view Amazon’s current selection, prices and availability.</p><a href={amazonLinks.electronics} target="_blank" rel="sponsored noopener noreferrer">Shop electronics on Amazon <span aria-hidden="true">↗</span></a><small>Amazon handles checkout, payment, delivery and returns.</small>
      </div>
    </section>

    <section className="categoryStrip" id="categories">
      <div className="stripHeading"><div><span className="eyebrow">BROWSE YOUR WAY</span><h2>Start with a category</h2></div><p>Jump directly to the electronics you need instead of scrolling through everything.</p></div>
      <div className="categoryButtons">{categories.filter((item) => item !== "All").map((item) => <button onClick={() => chooseCategory(item)} key={item}><span>{categoryIcons[item] ?? "◇"}</span><strong>{item}</strong><small>{categoryCounts[item]} collection{categoryCounts[item] === 1 ? "" : "s"}</small></button>)}</div>
    </section>

    <section className="amazonShop" id="amazon-shop">
      <div><span className="eyebrow">SHOPPING DESTINATIONS</span><h2>Popular Amazon searches</h2><p>These curated links open current Amazon.in results. OfferLoom does not copy or claim live Amazon pricing.</p></div>
      <div className="amazonQuickLinks"><a href={amazonLinks.mobiles} target="_blank" rel="sponsored noopener noreferrer"><span>▯</span><strong>5G phones</strong><small>Under ₹20,000 ↗</small></a><a href={amazonLinks.laptops} target="_blank" rel="sponsored noopener noreferrer"><span>▰</span><strong>Laptops</strong><small>16 GB + SSD options ↗</small></a><a href={amazonLinks.audio} target="_blank" rel="sponsored noopener noreferrer"><span>◉</span><strong>ANC earbuds</strong><small>Wireless audio ↗</small></a></div>
    </section>

    <section className="catalog" id="catalog">
      <div className="catalogHead"><div><span className="eyebrow">PRODUCT FINDER</span><h2>{category === "All" ? "All electronics" : category}</h2><p>{query ? `Showing matches for “${query}”.` : "Choose a product group, review the key features, then shop through an available merchant."}</p></div><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="name">Name: A to Z</option><option value="category">Category</option></select></label></div>
      <div className="catalogLayout">
        <aside className="categoryMenu" aria-label="Filter by category"><strong>Categories</strong>{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}><span>{item}</span><small>{categoryCounts[item]}</small></button>)}</aside>
        <div className="catalogResults">
          <div className="mobileFilters" role="group" aria-label="Product categories">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
          <div className="resultSummary"><span>{visible.length} product collection{visible.length === 1 ? "" : "s"}</span>{(query || category !== "All") && <button onClick={reset}>Clear filters</button>}</div>
          {visible.length ? <div className="productGrid">{visible.map((product) => <article className="productCard" key={product.id}><div className="productTop"><div className="productIcon" aria-hidden="true">{product.icon}</div><div><span className="categoryTag">{product.category}</span><h3>{product.detailPath ? <Link href={product.detailPath}>{product.name}</Link> : product.name}</h3><p>{product.summary}</p></div></div><div className="specs">{product.specs.map((spec) => <span key={spec}>{spec}</span>)}</div><div className="cardActions">{product.detailPath && <Link className="compareLink" href={product.detailPath}>Compare stores</Link>}<a className="amazonCta" href={product.listings[0].affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`Shop ${product.name} on Amazon`}>Check on Amazon <span aria-hidden="true">↗</span></a></div><small className="priceNote">Current price and availability shown on Amazon.in</small></article>)}</div> : <div className="emptyState"><strong>No matching products yet</strong><p>Try another word or clear the selected category.</p><button onClick={reset}>Show all electronics</button></div>}
        </div>
      </div>
      <p className="disclosure"><strong>Affiliate and price notice:</strong> As an Amazon Associate I earn from qualifying purchases. Prices and availability can change at any time and are confirmed on Amazon.in. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>

    <section className="how" id="how"><div><span>01</span><h3>Search or browse</h3><p>Find electronics by name, use case or category.</p></div><div><span>02</span><h3>Review the collection</h3><p>Use the summaries and specifications to narrow your choice.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Open an approved link and confirm the live price before buying.</p></div></section>
  </main>;
}
