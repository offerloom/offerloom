"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import SiteFooter from "./components/SiteFooter";
import BrandMark from "./components/BrandMark";
import DealAlertsBar from "./components/DealAlertsBar";
import DealAlertsFloat from "./components/DealAlertsFloat";
import SocialLinks from "./components/SocialLinks";
import { heroCategorySlides } from "./lib/hero-categories";

type Listing = { store: string; affiliateUrl?: string };
type Offer = { price: number; mrp: number | null; checkedAt: string };
type Product = { offer?: Offer | null; imageUrl?: string | null; id: string | number; name: string; category: string; summary: string; specs: string[]; listings: Listing[]; detailPath?: string; collectionSources?: string[]; merchant?: string };
type ManagedProduct = { offer?: Offer | null; imageUrl?: string | null; merchant: string; merchantName: string; id: string; name: string; category: string; summary: string; specs: string[]; outboundPath: string; detailPath: string; collectionSources?: string[] };

export default function Home() {
  const [dealCategory, setDealCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [managedProducts, setManagedProducts] = useState<Product[]>([]);
  const [catalogState, setCatalogState] = useState("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/products", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (!active) return;
        setCatalogState("ready");
        setManagedProducts(data.products.map((product: ManagedProduct) => ({
          imageUrl: product.imageUrl,
          offer: product.offer,
          merchant: product.merchant,
          collectionSources: product.collectionSources ?? [],
          id: product.id,
          name: product.name,
          category: product.category,
          summary: product.summary,
          specs: product.specs,
          listings: [{ store: product.merchantName, affiliateUrl: product.outboundPath }],
          detailPath: product.detailPath,
        })));
      })
      .catch(() => { if (active) setCatalogState("error"); });
    return () => { active = false; };
  }, []);

  const discountOf = (product: Product) => product.offer?.mrp ? 1 - product.offer.price / product.offer.mrp : 0;
  const photoProducts = managedProducts.filter((product) => product.imageUrl);
  const availableCategories = new Set(photoProducts.map((product) => product.category));
  // Only rotate hero banners for categories we currently have real, in-stock deals for.
  const slides = (availableCategories.size ? heroCategorySlides.filter((item) => availableCategories.has(item.filterCategory)) : heroCategorySlides)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.filterCategory === item.filterCategory) === index);
  const dealCategories = ["All", ...new Set(photoProducts.map((product) => product.category))];
  const term = query.trim().toLowerCase();
  const frontProducts = photoProducts
    .filter((product) => dealCategory === "All" || product.category === dealCategory)
    .filter((product) => !term || `${product.name} ${product.category} ${product.summary}`.toLowerCase().includes(term))
    .sort((a, b) => discountOf(b) - discountOf(a));
  const productShelves = [
    { key: "new_releases", title: "Amazon New Releases", description: "Recently released finds", id: "new-releases", href: "/deals?collection=new_releases" },
    { key: "bestsellers", title: "Amazon Bestsellers", description: "Popular picks from bestseller lists", id: "bestsellers", href: "/deals?collection=bestsellers" },
    { key: "todays_deals", title: "Today’s Deals", description: "Current deals checked by OfferLoom", id: "todays-deals", href: "/deals?collection=todays_deals" },
    { key: "ajio", title: "AJIO Fashion Deals", description: "Fashion picks with approved AJIO ACE links", id: "ajio-deals", href: "/deals?merchant=ajio" },
  ].map((shelf) => ({
    ...shelf,
    products: frontProducts.filter((product) => shelf.key === "ajio"
      ? product.merchant === "ajio"
      : product.collectionSources?.includes(shelf.key)).slice(0, 16),
  }));

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [playing, slides.length]);

  const activeSlideIndex = slide % slides.length;
  const activeSlide = slides[activeSlideIndex];
  const heroDealPool = photoProducts.filter((product) => activeSlide.filterCategory === "All" || product.category === activeSlide.filterCategory);
  const heroDeals = [...(heroDealPool.length ? heroDealPool : photoProducts)].sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 3);
  const heroBestDiscount = heroDeals.length ? Math.round(discountOf(heroDeals[0]) * 100) : 0;

  function search(event: FormEvent) {
    event.preventDefault();
    setQuery(draft);
    document.querySelector("#front-deals-heading")?.scrollIntoView({ behavior: "smooth" });
  }

  function clearSearch() {
    setDealCategory("All");
    setQuery("");
    setDraft("");
  }

  return <main className="homePage">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="OfferLoom home"><BrandMark /><span>Offer<span>Loom</span></span></a>
      <nav aria-label="Main navigation"><a href="#front-deals-heading">Find products</a><Link href="/guides">Buying guides</Link><a href="#how">How it works</a></nav>
      <div className="topbarActions">
        <SocialLinks variant="header" />
        <a className="alertButton" href="#front-deals-heading">Find a deal</a>
      </div>
    </header>
    <DealAlertsBar />
    <section className="campaignHero" id="top" aria-roledescription="carousel" aria-label="OfferLoom shopping inspiration">
      <div className="campaignCopy">
        <span className="campaignKicker">THE OFFERLOOM EDIT · {activeSlide.eyebrow}</span>
        <h1><a className="campaignTitleLink" href={activeSlide.amazonUrl} target="_blank" rel="sponsored noopener noreferrer">{activeSlide.title}</a></h1>
        <p>{activeSlide.text}</p>
        <div className="campaignActions"><a href="#front-deals-heading">Explore product picks <span aria-hidden="true">↗</span></a><a href={activeSlide.amazonUrl} target="_blank" rel="sponsored noopener noreferrer">Browse on Amazon →</a></div>
        <ul className="campaignTrust">
          <li>✓ Product checks run twice daily</li>
          <li>✓ Every link goes straight to the seller — no middleman checkout</li>
          <li>✓ Clear affiliate disclosure, always</li>
        </ul>
        <div className="campaignControls"><button onClick={() => setSlide((activeSlideIndex - 1 + slides.length) % slides.length)} aria-label="Previous banner">←</button><span>{String(activeSlideIndex + 1).padStart(2, "0")} / {slides.length}</span><button onClick={() => setSlide((activeSlideIndex + 1) % slides.length)} aria-label="Next banner">→</button><button aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"} banners</button></div>
      </div>
      <div className="campaignArtwork">
        {heroDeals.length ? (
          <div className={`campaignCollage campaignCollage-count-${heroDeals.length}`}>
            {heroDeals.map((product) => <Link className="collageItem" href={product.detailPath!} key={product.id}>
              <img src={product.imageUrl!} alt={product.name} loading="eager" />
              {product.offer?.mrp && product.offer.mrp > product.offer.price && <span className="collageBadge">{Math.round(discountOf(product) * 100)}% OFF</span>}
            </Link>)}
          </div>
        ) : <Link className="campaignFallbackLink" href={activeSlide.amazonUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`Browse ${activeSlide.eyebrow} on Amazon`}><img src="/category-showcase-v1.png" width="2172" height="724" alt="Shopping inspiration featuring electronics, fashion and home essentials" fetchPriority="high"/></Link>}
        <span>{heroDeals.length ? (heroBestDiscount > 0 ? `Up to ${heroBestDiscount}% off` : `${activeSlide.filterCategory === "All" ? "Today's" : activeSlide.filterCategory} picks`) : "Electronics. Fashion. Home."}</span>
        <small>{heroDeals.length ? "Live product picks" : "Category inspiration"}</small>
      </div>
    </section>
    <section className="finder"><form className="search" onSubmit={search}><span aria-hidden="true">⌕</span><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Search products" placeholder="Search phones, fashion, appliances…"/><button>Find products</button></form><div className="popularSearches"><span>Popular:</span><button onClick={() => { setDraft("5G phone"); setQuery("5G phone"); }}>5G phones</button><button onClick={() => { setDraft("fashion"); setQuery("fashion"); }}>Fashion</button><button onClick={() => { setDraft("laptop"); setQuery("laptop"); }}>Laptops</button><button onClick={() => { setDraft("appliances"); setQuery("appliances"); }}>Appliances</button></div></section>
    <section className="frontDeals" aria-labelledby="front-deals-heading">
      <div className="frontDealsHeading"><h2 id="front-deals-heading">Shop today’s product picks</h2><span>{catalogState === "loading" ? "Loading products…" : `${frontProducts.length} products`}</span></div>
      {catalogState === "error" && <p role="status">Product details could not be loaded. Please refresh to try again.</p>}
      {catalogState === "ready" && !photoProducts.length && <p>New product picks are being reviewed. Check back soon.</p>}
      {catalogState === "ready" && photoProducts.length > 0 && !frontProducts.length && <div className="emptyState"><strong>No matching products</strong><p>Try another category or clear the search.</p><button onClick={clearSearch}>Show all products</button></div>}
      <div className="dealCategoryTabs" role="group" aria-label="Filter product deals">{dealCategories.map((item) => <button key={item} onClick={() => setDealCategory(item)} aria-pressed={dealCategory === item}>{item === "All" ? "All picks" : item}</button>)}</div>
      {productShelves.map((shelf) => <section className="productShelf" aria-labelledby={`${shelf.id}-heading`} key={shelf.key}>
        <div className="productShelfHeading"><div><span>{shelf.description}</span><h3 id={`${shelf.id}-heading`}>{shelf.title}</h3></div><a href={shelf.href}>View all <span aria-hidden="true">→</span></a></div>
        {shelf.products.length ? <div className="productRail" id={`${shelf.id}-rail`} role="region" aria-label={`${shelf.title} products`}>
          {shelf.products.map((product) => <ProductCard product={product} discount={discountOf(product)} key={product.id} />)}
        </div> : <p className="shelfEmpty">No validated products in this collection yet. Check back after the next update.</p>}
      </section>)}
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>

    <section className="how" id="how"><div><span>01</span><h3>Search or browse</h3><p>Find electronics by name, use case or category.</p></div><div><span>02</span><h3>Review the collection</h3><p>Use the summaries and specifications to narrow your choice.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Open an approved link and confirm the live price before buying.</p></div></section>
    <DealAlertsFloat />
    <SiteFooter />
  </main>;
}

function ProductCard({ product, discount }: { product: Product; discount: number }) {
  return <article className="railProduct">
    {product.imageUrl && <Link className="railProductImage" href={product.detailPath!}><img src={product.imageUrl} alt={product.name} loading="lazy"/>{discount > 0 && <span>{Math.round(discount * 100)}% OFF</span>}</Link>}
    <span className="categoryTag">{product.merchant === "ajio" ? "AJIO · " : ""}{product.category}</span>
    <h4><Link href={product.detailPath!}>{product.name}</Link></h4>
    {product.offer && <div className="railProductPrice"><strong>₹{(product.offer.price / 100).toLocaleString("en-IN")}</strong>{product.offer.mrp && product.offer.mrp > product.offer.price && <del>₹{(product.offer.mrp / 100).toLocaleString("en-IN")}</del>}</div>}
    <a className="offerCta" href={product.listings[0].affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">{product.offer ? "View deal →" : "Check price →"}</a>
  </article>;
}
