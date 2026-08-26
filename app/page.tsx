"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import SiteFooter from "./components/SiteFooter";
import BrandMark from "./components/BrandMark";
import ShopCategoryGrid from "./components/ShopCategoryGrid";
import DealAlertsBar from "./components/DealAlertsBar";
import DealAlertsFloat from "./components/DealAlertsFloat";
import SocialLinks from "./components/SocialLinks";
import { heroCategorySlides } from "./lib/hero-categories";
import { offerloomAmazonSearchPath } from "./lib/amazon";

type Listing = { store: string; affiliateUrl?: string };
type Product = { id: string | number; icon: string; name: string; category: string; summary: string; specs: string[]; listings: Listing[]; detailPath?: string };
type ManagedProduct = { id: string; name: string; category: string; summary: string; specs: string[]; outboundPath: string; detailPath: string };

const amazonLinks = {
  electronics: offerloomAmazonSearchPath("electronics"),
  mobiles: offerloomAmazonSearchPath("5g phone under 20000"),
  laptops: offerloomAmazonSearchPath("16gb ram 512gb ssd laptop"),
  audio: offerloomAmazonSearchPath("wireless earbuds with anc"),
  televisions: offerloomAmazonSearchPath("55 inch 4k smart tv"),
  gaming: offerloomAmazonSearchPath("gaming console"),
  appliances: offerloomAmazonSearchPath("energy efficient refrigerator"),
  fashion: offerloomAmazonSearchPath("fashion"),
};

const products: Product[] = [
  { id: 1, icon: "▯", name: "5G phones under ₹20,000", category: "Mobiles", summary: "Explore current 5G phones suited to calls, photos and everyday streaming.", specs: ["5G", "128 GB options", "Large batteries"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.mobiles }] },
  { id: 2, icon: "▰", name: "Everyday performance laptops", category: "Laptops", summary: "Explore practical configurations for work, study and light creative tasks.", specs: ["16 GB options", "SSD storage", "15.6-inch options"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.laptops }] },
  { id: 3, icon: "◉", name: "Wireless earbuds with ANC", category: "Audio", summary: "Explore compact earbuds with noise cancellation and portable charging cases.", specs: ["ANC options", "Bluetooth", "Fast charge"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.audio }] },
  { id: 4, icon: "▣", name: "55-inch 4K smart televisions", category: "TVs", summary: "Explore large-screen televisions with current streaming and display features.", specs: ["4K UHD", "HDR options", "Smart TV"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.televisions }] },
  { id: 5, icon: "✣", name: "Current-generation game consoles", category: "Gaming", summary: "Explore living-room gaming systems with fast storage and wireless controls.", specs: ["Current generation", "4K options", "Wireless"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.gaming }] },
  { id: 6, icon: "⌂", name: "Energy-efficient refrigerators", category: "Appliances", summary: "Explore family-sized refrigerators focused on efficient everyday use.", specs: ["Frost-free options", "Convertible options", "Energy rated"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.appliances }] },
  { id: 7, icon: "♢", name: "Everyday fashion essentials", category: "Fashion", summary: "Explore versatile clothing, footwear and accessories for everyday wardrobes.", specs: ["Men", "Women", "Accessories"], listings: [{ store: "Amazon", affiliateUrl: amazonLinks.fashion }] },
];

const departmentFilters = ["All", "Electronics", "Fashion", "Home"] as const;
const electronicsCategories = ["Mobiles", "Laptops", "Audio", "TVs", "Gaming"];
const categoryIcons: Record<string, string> = { Electronics: "◫", Mobiles: "▯", Laptops: "▰", Audio: "◉", TVs: "▣", Gaming: "✣", Home: "⌂", Appliances: "⌂", Fashion: "♢" };
const slides = heroCategorySlides;

function belongsToCategory(product: Product, selected: string) {
  if (selected === "All") return true;
  if (selected === "Electronics") return electronicsCategories.includes(product.category);
  if (selected === "Home") return product.category === "Appliances";
  return product.category === selected;
}

function isElectronicsDepartment(selected: string) {
  return selected === "Electronics" || electronicsCategories.includes(selected);
}

function isHomeDepartment(selected: string) {
  return selected === "Home" || selected === "Appliances";
}

function departmentLabel(selected: string) {
  if (selected === "All") return "All";
  if (isElectronicsDepartment(selected)) return "Electronics";
  if (isHomeDepartment(selected)) return "Home";
  return selected;
}

export default function Home() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState("recommended");
  const [slide, setSlide] = useState(0);
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

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  const allProducts = useMemo(() => [...managedProducts, ...products], [managedProducts]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = allProducts.filter((product) => belongsToCategory(product, category) && (!term || `${product.name} ${product.category} ${product.summary} ${product.specs.join(" ")}`.toLowerCase().includes(term)));
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

  return <main className="homePage">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="OfferLoom home"><BrandMark /><span>Offer<span>Loom</span></span></a>
      <nav aria-label="Main navigation"><a href="#catalog">Find products</a><a href="#categories">Categories</a><a href="#featured">Featured picks</a><Link href="/guides">Buying guides</Link><a href="#how">How it works</a></nav>
      <div className="topbarActions">
        <SocialLinks variant="header" />
        <a className="alertButton" href="#catalog">Find a deal</a>
      </div>
    </header>
    <DealAlertsBar />
    <section className={`heroSlider ${slides[slide].theme}`} id="top" aria-roledescription="carousel" aria-label="OfferLoom shop by category">
      <div className="heroSlide" aria-live="polite"><span className="eyebrow">{slides[slide].eyebrow}</span><h1>{slides[slide].title}</h1><p>{slides[slide].text}</p><div className="slideActions"><a className="slideAmazonCta" href={slides[slide].amazonUrl} target="_blank" rel="sponsored noopener noreferrer">{slides[slide].cta}</a><span>Opens approved Amazon catalog</span></div></div>
      <a className={`heroOfferBanner banner-${slides[slide].theme}`} href={slides[slide].amazonUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`${slides[slide].promo.dealLine} on ${slides[slide].eyebrow.toLowerCase()}`}>
        <div className="heroOfferArt">
          <img className="heroOfferImage" src={slides[slide].image} alt={slides[slide].imageAlt} />
          <span className="heroOfferCorner">{slides[slide].promo.corner}</span>
        </div>
        <div className="heroOfferCopy">
          <span className="heroOfferBadge">{slides[slide].promo.badge}</span>
          <strong className="heroOfferDeal">{slides[slide].promo.dealLine}</strong>
          <span className="heroOfferPill">{slides[slide].promo.extraTag}</span>
          <p className="heroOfferMeta">{slides[slide].promo.highlight}</p>
          <span className="heroOfferCta">{slides[slide].promo.shopLabel}</span>
          <small className="heroOfferFine">{slides[slide].promo.disclaimer}</small>
        </div>
      </a>
      <button className="slideArrow previous" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} aria-label="Previous slide">‹</button><button className="slideArrow next" onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Next slide">›</button>
      <div className="slideDots" role="group" aria-label="Choose a slide">{slides.map((item, index) => <button className={slide === index ? "active" : ""} onClick={() => setSlide(index)} aria-label={`Show ${item.eyebrow.toLowerCase()} slide`} key={item.id}/>)}</div>
    </section>
    <section className="finder"><form className="search" onSubmit={search}><span aria-hidden="true">⌕</span><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Search products" placeholder="Search phones, fashion, appliances…"/><button>Find products</button></form><div className="popularSearches"><span>Popular:</span><button onClick={() => { setDraft("5G phone"); setQuery("5G phone"); }}>5G phones</button><button onClick={() => { setDraft("fashion"); setQuery("fashion"); }}>Fashion</button><button onClick={() => { setDraft("laptop"); setQuery("laptop"); }}>Laptops</button><button onClick={() => { setDraft("appliances"); setQuery("appliances"); }}>Appliances</button></div></section>

    <section className="categoryStrip" id="categories">
      <div className="stripHeading"><div><span className="eyebrow">BROWSE YOUR WAY</span><h2>Start with a category</h2></div><p>Each category opens the approved Amazon catalog in a new tab.</p></div>
      <ShopCategoryGrid heading="Shop by category" />
    </section>

    <section className="featuredShop" id="featured">
      <div><span className="eyebrow">FEATURED PICKS</span><h2>Explore what interests you</h2><p>Start with a category. The available shopping destination is shown clearly before you leave OfferLoom.</p></div>
      <div className="featuredQuickLinks"><a href={amazonLinks.mobiles} target="_blank" rel="sponsored noopener noreferrer"><span>▯</span><strong>Mobiles</strong><small>Shop on Amazon →</small></a><a href={amazonLinks.fashion} target="_blank" rel="sponsored noopener noreferrer"><span>♢</span><strong>Fashion</strong><small>Shop on Amazon →</small></a><a href={amazonLinks.appliances} target="_blank" rel="sponsored noopener noreferrer"><span>⌂</span><strong>Home</strong><small>Shop on Amazon →</small></a></div>
    </section>

    <section className="catalog" id="catalog">
      <div className="catalogHead"><div><span className="eyebrow">PRODUCT FINDER</span><h2>{category === "All" ? "All products" : category}</h2><p>{query ? `Showing matches for “${query}”.` : "Filter by department and product type, review the key features, then shop through an available merchant."}</p></div><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="name">Name: A to Z</option><option value="category">Category</option></select></label></div>
      <div className="catalogFilters" aria-label="Filter product collections">
        <div className="filterGroup">
          <span className="filterLabel">Department</span>
          <div className="filterPills" role="group" aria-label="Filter by department">
            {departmentFilters.map((item) => (
              <button
                className={departmentLabel(category) === item ? "active" : ""}
                onClick={() => chooseCategory(item)}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {isElectronicsDepartment(category) ? (
          <div className="filterGroup">
            <span className="filterLabel">Electronics type</span>
            <div className="filterPills" role="group" aria-label="Filter electronics products">
              <button className={category === "Electronics" ? "active" : ""} onClick={() => setCategory("Electronics")} type="button">All electronics</button>
              {electronicsCategories.map((item) => (
                <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item} type="button">{item}</button>
              ))}
            </div>
          </div>
        ) : null}
        {isHomeDepartment(category) ? (
          <div className="filterGroup">
            <span className="filterLabel">Home type</span>
            <div className="filterPills" role="group" aria-label="Filter home products">
              <button className={category === "Home" ? "active" : ""} onClick={() => setCategory("Home")} type="button">All home</button>
              <button className={category === "Appliances" ? "active" : ""} onClick={() => setCategory("Appliances")} type="button">Appliances</button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="catalogResults">
        <div className="resultSummary"><span>{visible.length} product collection{visible.length === 1 ? "" : "s"}</span>{(query || category !== "All") && <button onClick={reset}>Clear filters</button>}</div>
        {visible.length ? <div className="productGrid">{visible.map((product) => <article className="productCard" key={product.id}><div className="productTop"><div className="productIcon" aria-hidden="true">{product.icon}</div><div><span className="categoryTag">{product.category}</span><h3>{product.detailPath ? <Link href={product.detailPath}>{product.name}</Link> : product.name}</h3><p>{product.summary}</p></div></div><div className="specs">{product.specs.map((spec) => <span key={spec}>{spec}</span>)}</div><div className="cardActions">{product.detailPath && <Link className="compareLink" href={product.detailPath}>Compare stores</Link>}<a className="offerCta" href={product.listings[0].affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`View current offers for ${product.name}`}>{product.detailPath ? "View on Amazon" : "Browse on Amazon"} <span aria-hidden="true">↗</span></a></div><small className="priceNote">{product.detailPath ? "Tagged product link · Check current price on Amazon" : `Opens Amazon search with ${product.listings[0].store} · Pick a product there`}</small></article>)}</div> : <div className="emptyState"><strong>No matching products yet</strong><p>Try another filter or clear the selected department.</p><button onClick={reset}>Show all products</button></div>}
      </div>
      <p className="disclosure"><strong>Affiliate and price notice:</strong> OfferLoom may earn a commission when you use eligible merchant links, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. Prices and availability can change and are confirmed on the merchant website. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p>
    </section>

    <section className="how" id="how"><div><span>01</span><h3>Search or browse</h3><p>Find electronics by name, use case or category.</p></div><div><span>02</span><h3>Review the collection</h3><p>Use the summaries and specifications to narrow your choice.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Open an approved link and confirm the live price before buying.</p></div></section>
    <DealAlertsFloat />
    <SiteFooter />
  </main>;
}
