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
type Product = { offer?: Offer | null; imageUrl?: string | null; id: string | number; name: string; category: string; summary: string; specs: string[]; listings: Listing[]; detailPath?: string };
type ManagedProduct = { offer?: Offer | null; imageUrl?: string | null; merchantName: string; id: string; name: string; category: string; summary: string; specs: string[]; outboundPath: string; detailPath: string };

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
  const slides = availableCategories.size ? heroCategorySlides.filter((item) => availableCategories.has(item.filterCategory)) : heroCategorySlides;
  const dealCategories = ["All", ...new Set(photoProducts.map((product) => product.category))];
  const term = query.trim().toLowerCase();
  const frontProducts = photoProducts
    .filter((product) => dealCategory === "All" || product.category === dealCategory)
    .filter((product) => !term || `${product.name} ${product.category} ${product.summary}`.toLowerCase().includes(term))
    .sort((a, b) => discountOf(b) - discountOf(a));

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
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.text}</p>
        <div className="campaignActions"><a href="#front-deals-heading">Explore product picks <span aria-hidden="true">↗</span></a><a href={activeSlide.amazonUrl} target="_blank" rel="sponsored noopener noreferrer">Browse on Amazon →</a></div>
        <ul className="campaignTrust">
          <li>✓ Prices refreshed every 3 hours, not stale screenshots</li>
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
        ) : <img src="/category-showcase-v1.png" width="2172" height="724" alt="Shopping inspiration featuring electronics, fashion and home essentials" fetchPriority="high"/>}
        <span>{heroDeals.length ? (heroBestDiscount > 0 ? `Up to ${heroBestDiscount}% off` : `${activeSlide.filterCategory === "All" ? "Today's" : activeSlide.filterCategory} picks`) : "Electronics. Fashion. Home."}</span>
        <small>{heroDeals.length ? "Live product picks" : "Category inspiration"}</small>
      </div>
    </section>
    <section className="finder"><form className="search" onSubmit={search}><span aria-hidden="true">⌕</span><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Search products" placeholder="Search phones, fashion, appliances…"/><button>Find products</button></form><div className="popularSearches"><span>Popular:</span><button onClick={() => { setDraft("5G phone"); setQuery("5G phone"); }}>5G phones</button><button onClick={() => { setDraft("fashion"); setQuery("fashion"); }}>Fashion</button><button onClick={() => { setDraft("laptop"); setQuery("laptop"); }}>Laptops</button><button onClick={() => { setDraft("appliances"); setQuery("appliances"); }}>Appliances</button></div></section>
    <section className="frontDeals" aria-labelledby="front-deals-heading">

      <div className="frontDealsHeading"><h2 id="front-deals-heading">Latest product picks</h2><span>{catalogState === "loading" ? "Loading products…" : `${frontProducts.length} curated products`}</span></div>
      {catalogState === "error" && <p role="status">Product details could not be loaded. Please refresh to try again.</p>}
      {catalogState === "ready" && !photoProducts.length && <p>New product picks are being reviewed. Check back soon.</p>}
      {catalogState === "ready" && photoProducts.length > 0 && !frontProducts.length && <div className="emptyState"><strong>No matching products</strong><p>Try another category or clear the search.</p><button onClick={clearSearch}>Show all products</button></div>}
      <div className="dealCategoryTabs" role="group" aria-label="Filter product deals">{dealCategories.map((item) => <button key={item} onClick={() => setDealCategory(item)} aria-pressed={dealCategory === item}>{item === "All" ? "All picks" : item}</button>)}</div>
      <div className="frontDealsGrid">{frontProducts.map((product) => <article className="frontDealCard" key={product.id}>
        {product.imageUrl && <Link className="dealPhoto" href={product.detailPath!}><img src={product.imageUrl} alt={product.name} width="320" height="320" loading="lazy" />{product.offer?.mrp && product.offer.mrp > product.offer.price && <span className="dealDiscount">{Math.round((1 - product.offer.price / product.offer.mrp) * 100)}% OFF</span>}</Link>}
        <span className="categoryTag">{product.listings[0].store} · {product.category}</span>
        <h3><Link href={product.detailPath!}>{product.name}</Link></h3>
        {product.offer && <div className="frontDealPrice"><strong>₹{(product.offer.price / 100).toLocaleString("en-IN")}</strong>{product.offer.mrp && product.offer.mrp > product.offer.price && <><del>₹{(product.offer.mrp / 100).toLocaleString("en-IN")}</del></>}<small>Checked {new Date(product.offer.checkedAt).toLocaleString("en-IN")}</small></div>}
        <div className="frontDealActions"><Link href={product.detailPath!}>Product details</Link><a className="offerCta" href={product.listings[0].affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">{product.offer ? "Grab deal →" : "Check price →"}</a></div>
        <small>Confirm current price and availability on {product.listings[0].store}.</small>
      </article>)}</div>
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>

    <section className="how" id="how"><div><span>01</span><h3>Search or browse</h3><p>Find electronics by name, use case or category.</p></div><div><span>02</span><h3>Review the collection</h3><p>Use the summaries and specifications to narrow your choice.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Open an approved link and confirm the live price before buying.</p></div></section>
    <DealAlertsFloat />
    <SiteFooter />
  </main>;
}
