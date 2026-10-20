"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import SiteFooter from "./components/SiteFooter";
import BrandMark from "./components/BrandMark";
import DealAlertsBar from "./components/DealAlertsBar";
import DealAlertsFloat from "./components/DealAlertsFloat";
import AjioCampaignOffers from "./components/AjioCampaignOffers";
import SocialLinks from "./components/SocialLinks";
import { heroCategorySlides } from "./lib/hero-categories";
import { formatCheckedAt } from "./lib/format-checked-at";
import { orderProductCategories, productCategorySectionId } from "./lib/product-category-navigation.mjs";
/* eslint @next/next/no-html-link-for-pages: "off" -- Native navigation avoids a Vinext Link runtime error ("e is not a function"). */

type Listing = { store: string; affiliateUrl?: string };
type Offer = { price: number; mrp: number | null; checkedAt: string };
type StoreOffer = { store: string; price: number | null };
type Product = { variantCount?: number; storeOffers?: StoreOffer[]; addedAt?: string; offer?: Offer | null; imageUrl?: string | null; id: string | number; name: string; category: string; summary: string; specs: string[]; listings: Listing[]; detailPath?: string; collectionSources?: string[]; merchant?: string; merchantName?: string };
type ManagedProduct = { variantCount?: number; storeOffers?: StoreOffer[]; addedAt?: string; offer?: Offer | null; imageUrl?: string | null; merchant: string; merchantName: string; id: string; name: string; category: string; summary: string; specs: string[]; outboundPath: string; detailPath: string; collectionSources?: string[] };

export default function Home() {
  const [dealCategory, setDealCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [managedProducts, setManagedProducts] = useState<Product[]>([]);
  const [catalogState, setCatalogState] = useState("loading");
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled(["/api/products"].map((url) =>
      fetch(url, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject())
    )).then(([recentResult]) => {
      if (!active) return;
      if (recentResult.status === "fulfilled") {
        setCatalogState("ready");
        setManagedProducts(recentResult.value.products.map((product: ManagedProduct) => ({
          imageUrl: product.imageUrl,
          storeOffers: product.storeOffers ?? [],
          variantCount: product.variantCount ?? 1,
          addedAt: product.addedAt,
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
    { key: "new_releases", title: "New Releases", description: "Recently released finds", id: "new-releases", href: "/deals?collection=new_releases" },
    { key: "bestsellers", title: "Bestsellers", description: "Popular picks from bestseller lists", id: "bestsellers", href: "/deals?collection=bestsellers" },
  ].map((shelf) => ({
    ...shelf,
    products: frontProducts
      .filter((product) => product.collectionSources?.includes(shelf.key))
      .slice(0, 16),
  }));
  // Extra mixed-store sections, built from the same live catalogue (Amazon + Flipkart + AJIO).
  const withPhoto = frontProducts.filter((product) => product.imageUrl && product.offer);
  const extraShelves = [
    { key: "top_deals", title: "Top Deals", description: "Biggest verified discounts across all stores", id: "top-deals", href: "/deals", products: withPhoto.slice(0, 16) },
    { key: "new_deals", title: "New Deals", description: "Just added to OfferLoom", id: "new-deals", href: "/deals",
      products: [...withPhoto].sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? "")).slice(0, 16) },
    { key: "spotlight", title: "In the Spotlight", description: "Compared across stores and big-ticket steals", id: "spotlight", href: "/deals",
      products: [...withPhoto.filter((product) => (product.storeOffers?.length ?? 0) > 1),
        ...withPhoto.filter((product) => (product.storeOffers?.length ?? 0) <= 1 && (product.offer?.price ?? 0) >= 100000 && discountOf(product) >= 0.4)].slice(0, 16) },
  ];
  const trends = productCategories.map((category) => {
    const items = withPhoto.filter((product) => product.category === category);
    return { category, count: items.length, image: items[0]?.imageUrl, best: items.length ? Math.round(discountOf(items[0]) * 100) : 0 };
  }).filter((trend) => trend.image).slice(0, 8);

  // Advance each product shelf by one card every 2 seconds, looping back to the start.
  // Pauses while the shopper hovers, touches or focuses a shelf, and respects reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rails = Array.from(document.querySelectorAll<HTMLElement>("[data-autoscroll]"));
    if (!rails.length) return;
    const paused = new WeakSet<HTMLElement>();
    const cleanups = rails.map((rail) => {
      const pause = () => paused.add(rail);
      const resume = () => paused.delete(rail);
      const events: [string, () => void][] = [["mouseenter", pause], ["mouseleave", resume], ["focusin", pause], ["focusout", resume], ["touchstart", pause], ["touchend", resume]];
      events.forEach(([name, handler]) => rail.addEventListener(name, handler, { passive: true }));
      return () => events.forEach(([name, handler]) => rail.removeEventListener(name, handler));
    });
    const timer = window.setInterval(() => {
      for (const rail of rails) {
        if (paused.has(rail) || rail.scrollWidth <= rail.clientWidth + 4) continue;
        const card = rail.firstElementChild as HTMLElement | null;
        const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
        const step = (card?.offsetWidth ?? rail.clientWidth) + gap;
        const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
        rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + step, behavior: "smooth" });
      }
    }, 2000);
    return () => { window.clearInterval(timer); cleanups.forEach((cleanup) => cleanup()); };
  }, [catalogState, managedProducts.length, query]);

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

  useEffect(() => {
    const tabs = categoryTabsRef.current;
    const selectedButton = tabs?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!tabs || !selectedButton) return;

    const tabsRect = tabs.getBoundingClientRect();
    const buttonRect = selectedButton.getBoundingClientRect();
    const margin = 12;
    if (buttonRect.left < tabsRect.left + margin) {
      tabs.scrollBy({ left: buttonRect.left - tabsRect.left - margin, behavior: "smooth" });
    } else if (buttonRect.right > tabsRect.right - margin) {
      tabs.scrollBy({ left: buttonRect.right - tabsRect.right + margin, behavior: "smooth" });
    }
  }, [dealCategory]);

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
      <nav aria-label="Main navigation"><a href="#front-deals-heading">Find products</a><a href="/guides">Buying guides</a><a href="#how">How it works</a></nav>
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
            {heroDeals.map((product) => <a className="collageItem" href={product.detailPath!} key={product.id}>
              <img src={product.imageUrl!} alt={product.name} loading="eager" />
              {product.offer?.mrp && product.offer.mrp > product.offer.price && <span className="collageBadge">{Math.round(discountOf(product) * 100)}% OFF</span>}
            </a>)}
          </div>
        ) : <a className="campaignFallbackLink" href={activeSlide.amazonUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`Browse ${activeSlide.eyebrow} on Amazon`}><img src="/category-showcase-v1.png" width="2172" height="724" alt="Shopping inspiration featuring electronics, fashion and home essentials" fetchPriority="high"/></a>}
        <span>{heroDeals.length ? (heroBestDiscount > 0 ? `Up to ${heroBestDiscount}% off` : `${activeSlide.filterCategory === "All" ? "Today's" : activeSlide.filterCategory} picks`) : "Electronics. Fashion. Home."}</span>
        <small>{heroDeals.length ? "Live product picks" : "Category inspiration"}</small>
      </div>
    </section>
    <section className="frontDeals" aria-labelledby="front-deals-heading">
      {catalogState === "error" && <p role="status">Product details could not be loaded. Please refresh to try again.</p>}
      {catalogState === "ready" && !photoProducts.length && <p>New product picks are being reviewed. Check back soon.</p>}
      {dealOfTheDay && <section className="dealOfTheDay" aria-labelledby="deal-of-the-day-heading">
        <div className="dealOfTheDayCopy"><span className="dealOfTheDayEyebrow">TODAY’S TOP VERIFIED DISCOUNT · {Math.round(discountOf(dealOfTheDay) * 100)}% OFF</span><h2 id="deal-of-the-day-heading">Deal of the Day</h2><p>{dealOfTheDay.name}</p><div className="dealOfTheDayPrice"><strong>₹{(dealOfTheDay.offer!.price / 100).toLocaleString("en-IN")}</strong><del>₹{(dealOfTheDay.offer!.mrp! / 100).toLocaleString("en-IN")}</del></div><small>Checked {formatCheckedAt(dealOfTheDay.offer!.checkedAt)} · Confirm today’s price with the seller.</small><a href={dealOfTheDay.detailPath}>Compare &amp; shop this deal →</a></div>
        {dealOfTheDay.imageUrl && <a href={dealOfTheDay.detailPath!} className="dealOfTheDayImage"><img src={dealOfTheDay.imageUrl} alt={dealOfTheDay.name} loading="eager"/><span>{Math.round(discountOf(dealOfTheDay) * 100)}% OFF</span></a>}
      </section>}
      {productShelves.map((shelf) => <section className="productShelf" aria-labelledby={`${shelf.id}-heading`} key={shelf.key}>
        <div className="productShelfHeading"><div><span>{shelf.description}</span><h2 id={`${shelf.id}-heading`}>{shelf.title}</h2></div><a href={shelf.href}>View all <span aria-hidden="true">→</span></a></div>
        {shelf.products.length ? <div className="productRail" data-autoscroll id={`${shelf.id}-rail`} role="region" aria-label={`${shelf.title} products`}>
          {shelf.products.map((product) => <ProductCard product={product} discount={discountOf(product)} key={`${product.merchant ?? "amazon"}:${product.id}`} />)}
        </div> : <p className="shelfEmpty">No validated products in this collection yet. Check back after the next update.</p>}
      </section>)}
      {trends.length > 0 && <section className="trendsSection" aria-labelledby="trends-heading">
        <div className="productShelfHeading"><div><span>Popular categories right now</span><h2 id="trends-heading">Trends You May Like</h2></div></div>
        <div className="trendGrid">{trends.map((trend) => <button type="button" className="trendTile" key={trend.category} onClick={() => goToCategory(trend.category)}>
          <img src={trend.image!} alt="" loading="lazy" /><strong>{trend.category}</strong><small>{trend.best > 0 ? `Up to ${trend.best}% off` : `${trend.count} deals`}</small>
        </button>)}</div>
      </section>}
      {extraShelves.filter((shelf) => shelf.products.length).map((shelf) => <section className="productShelf" aria-labelledby={`${shelf.id}-heading`} key={shelf.key}>
        <div className="productShelfHeading"><div><span>{shelf.description}</span><h2 id={`${shelf.id}-heading`}>{shelf.title}</h2></div><a href={shelf.href}>View all <span aria-hidden="true">→</span></a></div>
        <div className="productRail" data-autoscroll id={`${shelf.id}-rail`} role="region" aria-label={`${shelf.title} products`}>
          {shelf.products.map((product) => <ProductCard product={product} discount={discountOf(product)} key={`${shelf.key}:${product.id}`} />)}
        </div>
      </section>)}
      <div className="frontDealsHeading"><div><span className="catalogEyebrow">Browse the full OfferLoom catalogue</span><h2 id="front-deals-heading">All products, sorted by discount</h2></div><span>{catalogState === "loading" ? "Loading products…" : `${frontProducts.length} of ${managedProducts.length} products`}</span></div>
      <div className="dealCategoryTabs" ref={categoryTabsRef} role="group" aria-label="Jump to product category">{dealCategories.map((item) => <button key={item} onClick={() => goToCategory(item)} aria-pressed={dealCategory === item}>{item === "All" ? "All picks" : item}</button>)}</div>
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
      <AjioCampaignOffers limit={6} />
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>

    <section className="how" id="how"><div><span>01</span><h3>Search or browse</h3><p>Find electronics by name, use case or category.</p></div><div><span>02</span><h3>Review the collection</h3><p>Use the summaries and specifications to narrow your choice.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Open an approved link and confirm the live price before buying.</p></div></section>
    <DealAlertsFloat />
    <a className="backToTop" href="#top" aria-label="Go to top"><span aria-hidden="true">↑</span><span>Top</span></a>
    <SiteFooter />
  </main>;
}

function storeLabel(product: Product) {
  const stores = product.storeOffers?.map((offer) => offer.store) ?? [];
  return stores.length > 1 ? stores.join(" + ") : (product.merchantName ?? product.merchant ?? "OfferLoom");
}

/** Prices side by side (Amazon, Flipkart, AJIO …) when a product is sold by more than one store. */
function StorePrices({ product }: { product: Product }) {
  const offers = (product.storeOffers ?? []).filter((offer) => offer.price);
  if (offers.length < 2) return null;
  const order = ["Amazon", "Flipkart", "Croma", "AJIO"];
  const best = Math.min(...offers.map((offer) => offer.price!));
  return <ul className="storePrices" aria-label="Price by store">
    {[...offers].sort((a, b) => order.indexOf(a.store) - order.indexOf(b.store)).map((offer) => <li key={offer.store} className={offer.price === best ? "isBest" : undefined}>
      <span>{offer.store}</span><b>₹{(offer.price! / 100).toLocaleString("en-IN")}</b>{offer.price === best && <em>Best</em>}
    </li>)}
  </ul>;
}

function ProductCard({ product, discount }: { product: Product; discount: number }) {
  return <article className="railProduct">
    {product.imageUrl && <a className="railProductImage" href={product.detailPath!}><img src={product.imageUrl} alt={product.name} loading="lazy"/>{discount > 0 && <span>{Math.round(discount * 100)}% OFF</span>}</a>}
    <span className="categoryTag">{storeLabel(product)} · {product.category}</span>
    <h4><a href={product.detailPath!}>{product.name}</a></h4>
    {product.offer && <div className="railProductPrice"><strong>₹{(product.offer.price / 100).toLocaleString("en-IN")}</strong>{product.offer.mrp && product.offer.mrp > product.offer.price && <del>₹{(product.offer.mrp / 100).toLocaleString("en-IN")}</del>}</div>}
    <StorePrices product={product} />
    {(product.variantCount ?? 1) > 1 && <small className="moreColours">+{(product.variantCount ?? 1) - 1} more colour{(product.variantCount ?? 1) > 2 ? "s" : ""} at this price</small>}
    {product.offer?.checkedAt && <small className="priceCheckedAt">{formatCheckedAt(product.offer.checkedAt)}</small>}
    <a className="offerCta" href={product.detailPath}>{product.offer ? "Grab deal →" : "Check price →"}</a>
  </article>;
}

function CatalogProductCard({ product, discount }: { product: Product; discount: number }) {
  return <article className="frontDealCard">
    {product.imageUrl ? <a className="dealPhoto" href={product.detailPath!}><img src={product.imageUrl} alt={product.name} loading="lazy"/>{discount > 0 && <span className="dealDiscount">{Math.round(discount * 100)}% OFF</span>}</a> : <div className="dealPhoto dealPhotoPlaceholder" aria-hidden="true">{product.category}</div>}
    <span className="categoryTag">{storeLabel(product)} · {product.category}</span>
    <h3><a href={product.detailPath!}>{product.name}</a></h3>
    {product.offer && <div className="frontDealPrice"><strong>₹{(product.offer.price / 100).toLocaleString("en-IN")}</strong>{product.offer.mrp && product.offer.mrp > product.offer.price && <del>₹{(product.offer.mrp / 100).toLocaleString("en-IN")}</del>}</div>}
    <StorePrices product={product} />
    {(product.variantCount ?? 1) > 1 && <small className="moreColours">+{(product.variantCount ?? 1) - 1} more colour{(product.variantCount ?? 1) > 2 ? "s" : ""} at this price</small>}
    {product.offer?.checkedAt && <small>{formatCheckedAt(product.offer.checkedAt)}</small>}
    <div className="frontDealActions"><a className="offerCta" href={product.detailPath}>{product.offer ? "Grab deal →" : "Check price →"}</a></div>
  </article>;
}
