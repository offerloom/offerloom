"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import SiteFooter from "./components/SiteFooter";
import BrandMark from "./components/BrandMark";
import DealAlertsBar from "./components/DealAlertsBar";
import DealAlertsFloat from "./components/DealAlertsFloat";
import AjioCampaignOffers from "./components/AjioCampaignOffers";
import SocialLinks from "./components/SocialLinks";
import { heroCategorySlides } from "./lib/hero-categories";
import { formatCheckedAt } from "./lib/format-checked-at";
import { orderProductCategories, productCategorySectionId } from "./lib/product-category-navigation.mjs";

type Listing = { store: string; affiliateUrl?: string };
type Offer = { price: number; mrp: number | null; checkedAt: string };
type Product = { offer?: Offer | null; imageUrl?: string | null; id: string | number; name: string; category: string; summary: string; specs: string[]; listings: Listing[]; detailPath?: string; collectionSources?: string[]; merchant?: string; merchantName?: string };
type ManagedProduct = { offer?: Offer | null; imageUrl?: string | null; merchant: string; merchantName: string; id: string; name: string; category: string; summary: string; specs: string[]; outboundPath: string; detailPath: string; collectionSources?: string[] };

export default function Home() {
  const [dealCategory, setDealCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [managedProducts, setManagedProducts] = useState<Product[]>([]);
  const [ajioProducts, setAjioProducts] = useState<Product[]>([]);
  const [catalogState, setCatalogState] = useState("loading");

  useEffect(() => {
    let active = true;
    Promise.allSettled(["/api/products", "/api/products?merchant=ajio"].map((url) =>
      fetch(url, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject())
    )).then(([recentResult, ajioResult]) => {
      if (!active) return;
      if (recentResult.status === "fulfilled") {
        setCatalogState("ready");
        setManagedProducts(recentResult.value.products.map((product: ManagedProduct) => ({
          imageUrl: product.imageUrl,
          offer: product.offer,
          merchant: product.merchant,
          merchantName: product.merchantName,
          collectionSources: product.collectionSources ?? [],
          id: product.id,
          name: product.name,
          category: product.category,
          summary: product.summary,
          specs: product.specs,
          listings: [{ store: product.merchantName, affiliateUrl: product.outboundPath }],
          detailPath: product.detailPath,
        })));
      } else {
        setCatalogState("error");
      }
      if (ajioResult.status === "fulfilled") {
        setAjioProducts(ajioResult.value.products.map((product: ManagedProduct) => ({
          imageUrl: product.imageUrl,
          offer: product.offer,
          merchant: product.merchant,
          merchantName: product.merchantName,
          collectionSources: product.collectionSources ?? [],
          id: product.id,
          name: product.name,
          category: product.category,
          summary: product.summary,
          specs: product.specs,
          listings: [{ store: product.merchantName, affiliateUrl: product.outboundPath }],
          detailPath: product.detailPath,
        })));
      }
    });
    return () => { active = false; };
  }, []);

  const discountOf = (product: Product) => product.offer?.mrp ? 1 - product.offer.price / product.offer.mrp : 0;
  const photoProducts = managedProducts.filter((product) => product.imageUrl);
  const availableCategories = new Set(photoProducts.map((product) => product.category));
  // Only rotate hero banners for categories we currently have real, in-stock deals for.
  const slides = (availableCategories.size ? heroCategorySlides.filter((item) => availableCategories.has(item.filterCategory)) : heroCategorySlides)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.filterCategory === item.filterCategory) === index);
  const productCategories = orderProductCategories(managedProducts.map((product) => product.category));
  const categoryKey = productCategories.join("|");
  const dealCategories = ["All", ...productCategories];
  const term = query.trim().toLowerCase();
  const frontProducts = managedProducts
    .filter((product) => !term || `${product.name} ${product.category} ${product.summary}`.toLowerCase().includes(term))
    .sort((a, b) => discountOf(b) - discountOf(a));
  const dealOfTheDay = [...managedProducts]
    .filter((product) => product.offer?.mrp && product.offer.mrp > product.offer.price)
    .sort((a, b) => discountOf(b) - discountOf(a))[0];
  const productShelves = [
    { key: "todays_deals", title: "Today’s Deals", description: "Current deals checked by OfferLoom", id: "todays-deals", href: "/deals?collection=todays_deals" },
    { key: "bestsellers", title: "Amazon Bestsellers", description: "Popular picks from bestseller lists", id: "bestsellers", href: "/deals?collection=bestsellers" },
    { key: "new_releases", title: "Amazon New Releases", description: "Recently released finds", id: "new-releases", href: "/deals?collection=new_releases" },
    { key: "ajio", title: "AJIO Fashion Deals", description: "Fashion picks with approved AJIO ACE links", id: "ajio-deals", href: "/deals?merchant=ajio" },
  ].map((shelf) => ({
    ...shelf,
    products: (shelf.key === "ajio" ? ajioProducts : frontProducts)
      .filter((product) => shelf.key === "ajio"
        ? Boolean(product.imageUrl)
        : product.collectionSources?.includes(shelf.key))
      .slice(0, 16),
  }));

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [playing, slides.length]);

  useEffect(() => {
    const categorySections = Array.from(document.querySelectorAll<HTMLElement>("[data-product-category]"));
    if (!categorySections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const category = visibleSections[0]?.target.getAttribute("data-product-category");
      if (category) setDealCategory(category);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

    categorySections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [frontProducts.length, query, categoryKey]);

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
    setQuery("");
    setDraft("");
  }

  function goToCategory(category: string) {
    setDealCategory(category);
    const target = category === "All"
      ? document.querySelector("#front-deals-heading")
      : document.getElementById(productCategorySectionId(category));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <main className="homePage" id="top">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="OfferLoom home"><BrandMark /><span>Offer<span>Loom</span></span></a>
      <nav aria-label="Main navigation"><a href="#front-deals-heading">Find products</a><Link href="/guides">Buying guides</Link><a href="#how">How it works</a></nav>
      <form className="headerSearch" onSubmit={search} role="search"><span aria-hidden="true">⌕</span><input value={draft} onChange={(event) => { setDraft(event.target.value); setQuery(event.target.value); }} aria-label="Search products by name or category" placeholder="Search deals"/><button aria-label="Search products">⌕</button></form>
      <div className="topbarActions">
        <SocialLinks variant="header" />
        <a className="alertButton" href="#front-deals-heading">Find a deal</a>
      </div>
    </header>
    <DealAlertsBar />
    <section className="campaignHero" aria-roledescription="carousel" aria-label="OfferLoom shopping inspiration">
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
    <section className="frontDeals" aria-labelledby="front-deals-heading">
      {catalogState === "error" && <p role="status">Product details could not be loaded. Please refresh to try again.</p>}
      {catalogState === "ready" && !photoProducts.length && <p>New product picks are being reviewed. Check back soon.</p>}
      {productShelves.filter((shelf) => shelf.key === "todays_deals" || shelf.key === "bestsellers").map((shelf) => <section className="productShelf" aria-labelledby={`${shelf.id}-heading`} key={shelf.key}>
        <div className="productShelfHeading"><div><span>{shelf.description}</span><h2 id={`${shelf.id}-heading`}>{shelf.title}</h2></div><a href={shelf.href}>View all <span aria-hidden="true">→</span></a></div>
        {shelf.products.length ? <div className="productRail" id={`${shelf.id}-rail`} role="region" aria-label={`${shelf.title} products`}>
          {shelf.products.map((product) => <ProductCard product={product} discount={discountOf(product)} key={`${product.merchant ?? "amazon"}:${product.id}`} />)}
        </div> : <p className="shelfEmpty">No validated products in this collection yet. Check back after the next update.</p>}
      </section>)}
      {dealOfTheDay && <section className="dealOfTheDay" aria-labelledby="deal-of-the-day-heading">
        <div className="dealOfTheDayCopy"><span className="dealOfTheDayEyebrow">TODAY’S TOP VERIFIED DISCOUNT · {Math.round(discountOf(dealOfTheDay) * 100)}% OFF</span><h2 id="deal-of-the-day-heading">Deal of the Day</h2><p>{dealOfTheDay.name}</p><div className="dealOfTheDayPrice"><strong>₹{(dealOfTheDay.offer!.price / 100).toLocaleString("en-IN")}</strong><del>₹{(dealOfTheDay.offer!.mrp! / 100).toLocaleString("en-IN")}</del></div><small>Checked {formatCheckedAt(dealOfTheDay.offer!.checkedAt)} · Confirm today’s price with the seller.</small><a href={dealOfTheDay.listings[0]?.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">Shop this deal →</a></div>
        {dealOfTheDay.imageUrl && <Link href={dealOfTheDay.detailPath!} className="dealOfTheDayImage"><img src={dealOfTheDay.imageUrl} alt={dealOfTheDay.name} loading="eager"/><span>{Math.round(discountOf(dealOfTheDay) * 100)}% OFF</span></Link>}
      </section>}
      <div className="frontDealsHeading"><div><span className="catalogEyebrow">Browse the full OfferLoom catalogue</span><h2 id="front-deals-heading">All products, sorted by discount</h2></div><span>{catalogState === "loading" ? "Loading products…" : `${frontProducts.length} of ${managedProducts.length} products`}</span></div>
      <div className="dealCategoryTabs" role="group" aria-label="Jump to product category">{dealCategories.map((item) => <button key={item} onClick={() => goToCategory(item)} aria-pressed={dealCategory === item}>{item === "All" ? "All picks" : item}</button>)}</div>
      {catalogState === "ready" && managedProducts.length > 0 && !frontProducts.length && <div className="emptyState"><strong>No matching products</strong><p>Try another search or clear it.</p><button onClick={clearSearch}>Show all products</button></div>}
      {frontProducts.length > 0 && <div className="catalogSearchSummary"><span>{dealCategory === "All" ? "All categories" : `${dealCategory} · grouped by category`}{query ? ` · Search: “${query}”` : ""}</span>{query && <button onClick={clearSearch}>Clear search</button>}</div>}
      <div className="catalogCategoryGroups" aria-live="polite">{productCategories.map((category) => {
        const categoryProducts = frontProducts.filter((product) => product.category === category);
        if (!categoryProducts.length) return null;
        const sectionId = productCategorySectionId(category);
        return <section className="catalogCategory" id={sectionId} data-product-category={category} aria-labelledby={`${sectionId}-heading`} key={category}>
          <div className="catalogCategoryHeading"><h3 id={`${sectionId}-heading`}>{category}</h3><span>{categoryProducts.length} {categoryProducts.length === 1 ? "product" : "products"}</span></div>
          <div className="frontDealsGrid">{categoryProducts.map((product) => <CatalogProductCard product={product} discount={discountOf(product)} key={`${product.merchant ?? "amazon"}:${product.id}`} />)}</div>
        </section>;
      })}</div>
      {productShelves.filter((shelf) => shelf.key !== "todays_deals" && shelf.key !== "bestsellers").map((shelf) => <section className="productShelf" aria-labelledby={`${shelf.id}-heading`} key={shelf.key}>
        <div className="productShelfHeading"><div><span>{shelf.description}</span><h3 id={`${shelf.id}-heading`}>{shelf.title}</h3></div><a href={shelf.href}>View all <span aria-hidden="true">→</span></a></div>
        {shelf.products.length ? <div className="productRail" id={`${shelf.id}-rail`} role="region" aria-label={`${shelf.title} products`}>
          {shelf.products.map((product) => <ProductCard product={product} discount={discountOf(product)} key={`${product.merchant ?? "amazon"}:${product.id}`} />)}
        </div> : <p className="shelfEmpty">No validated products in this collection yet. Check back after the next update.</p>}
      </section>)}
      <AjioCampaignOffers limit={6} />
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>

    <section className="how" id="how"><div><span>01</span><h3>Search or browse</h3><p>Find electronics by name, use case or category.</p></div><div><span>02</span><h3>Review the collection</h3><p>Use the summaries and specifications to narrow your choice.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Open an approved link and confirm the live price before buying.</p></div></section>
    <DealAlertsFloat />
    <a className="backToTop" href="#top" aria-label="Go to top"><span aria-hidden="true">↑</span><span>Top</span></a>
    <SiteFooter />
  </main>;
}

function ProductCard({ product, discount }: { product: Product; discount: number }) {
  return <article className="railProduct">
    {product.imageUrl && <Link className="railProductImage" href={product.detailPath!}><img src={product.imageUrl} alt={product.name} loading="lazy"/>{discount > 0 && <span>{Math.round(discount * 100)}% OFF</span>}</Link>}
    <span className="categoryTag">{product.merchantName ?? (product.merchant === "ajio" ? "AJIO" : product.merchant === "myntra" ? "Myntra" : "Amazon")} · {product.category}</span>
    <h4><Link href={product.detailPath!}>{product.name}</Link></h4>
    {product.offer && <div className="railProductPrice"><strong>₹{(product.offer.price / 100).toLocaleString("en-IN")}</strong>{product.offer.mrp && product.offer.mrp > product.offer.price && <del>₹{(product.offer.mrp / 100).toLocaleString("en-IN")}</del>}</div>}
    {product.offer?.checkedAt && <small className="priceCheckedAt">{formatCheckedAt(product.offer.checkedAt)}</small>}
    <a className="offerCta" href={product.listings[0].affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">{product.offer ? "View deal →" : "Check price →"}</a>
  </article>;
}

function CatalogProductCard({ product, discount }: { product: Product; discount: number }) {
  return <article className="frontDealCard">
    {product.imageUrl ? <Link className="dealPhoto" href={product.detailPath!}><img src={product.imageUrl} alt={product.name} loading="lazy"/>{discount > 0 && <span className="dealDiscount">{Math.round(discount * 100)}% OFF</span>}</Link> : <div className="dealPhoto dealPhotoPlaceholder" aria-hidden="true">{product.category}</div>}
    <span className="categoryTag">{product.merchantName ?? product.merchant ?? "OfferLoom"} · {product.category}</span>
    <h3><Link href={product.detailPath!}>{product.name}</Link></h3>
    {product.offer && <div className="frontDealPrice"><strong>₹{(product.offer.price / 100).toLocaleString("en-IN")}</strong>{product.offer.mrp && product.offer.mrp > product.offer.price && <del>₹{(product.offer.mrp / 100).toLocaleString("en-IN")}</del>}</div>}
    {product.offer?.checkedAt && <small>{formatCheckedAt(product.offer.checkedAt)}</small>}
    <div className="frontDealActions"><a className="offerCta" href={product.listings[0]?.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">{product.offer ? "View deal →" : "Check price →"}</a></div>
  </article>;
}
