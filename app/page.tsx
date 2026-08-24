"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Listing = { store:string; affiliateUrl?:string };
type Product = { id:string|number; icon:string; name:string; category:string; summary:string; specs:string[]; listings:Listing[]; detailPath?:string };
type ManagedProduct = { id:string; name:string; category:string; summary:string; specs:string[]; outboundPath:string; detailPath:string };
const products:Product[] = [
  {id:1,icon:"▯",name:"5G phones under ₹20,000",category:"Mobiles",summary:"Explore current 5G phones suited to calls, photos and everyday streaming.",specs:["5G","128 GB options","Large batteries"],listings:[{store:"Amazon",affiliateUrl:"https://www.amazon.in/s?k=5g+phone+under+20000&linkCode=ll2&tag=offerloom-21&linkId=49807149200b7c8ffa3fe652d3e2734c&ref_=as_li_ss_tl"},{store:"Flipkart"}]},
  {id:2,icon:"▰",name:"Everyday performance laptops",category:"Laptops",summary:"Explore practical configurations for work, study and light creative tasks.",specs:["16 GB options","SSD storage","15.6-inch options"],listings:[{store:"Amazon",affiliateUrl:"https://www.amazon.in/s?k=16gb+ram+512gb+ssd+laptop&tag=offerloom-21"},{store:"Flipkart"}]},
  {id:3,icon:"◉",name:"Wireless earbuds with ANC",category:"Audio",summary:"Explore compact earbuds with noise cancellation and portable charging cases.",specs:["ANC options","Bluetooth","Fast charge"],listings:[{store:"Amazon",affiliateUrl:"https://www.amazon.in/s?k=wireless+earbuds+with+anc&linkCode=ll2&tag=offerloom-21&linkId=57c27eff35deb2c3b2c1c4b1d796992d&ref_=as_li_ss_tl"},{store:"Flipkart"}]},
  {id:4,icon:"▣",name:"55-inch 4K smart televisions",category:"TVs",summary:"Explore large-screen televisions with current streaming and display features.",specs:["4K UHD","HDR options","Smart TV"],listings:[{store:"Amazon",affiliateUrl:"https://www.amazon.in/s?k=55+inch+4k+smart+tv&tag=offerloom-21"},{store:"Flipkart"}]},
  {id:5,icon:"✣",name:"Current-generation game consoles",category:"Gaming",summary:"Explore living-room gaming systems with fast storage and wireless controls.",specs:["Current generation","4K options","Wireless"],listings:[{store:"Amazon",affiliateUrl:"https://www.amazon.in/s?k=gaming+console&tag=offerloom-21"},{store:"Flipkart"}]},
  {id:6,icon:"⌂",name:"Energy-efficient refrigerators",category:"Appliances",summary:"Explore family-sized refrigerators focused on efficient everyday use.",specs:["Frost-free options","Convertible options","Energy rated"],listings:[{store:"Amazon",affiliateUrl:"https://www.amazon.in/s?k=energy+efficient+refrigerator&tag=offerloom-21"},{store:"Flipkart"}]},
];
const categories=["All","Mobiles","Laptops","Audio","TVs","Gaming","Appliances"];
const categoryIcons:Record<string,string>={Mobiles:"▯",Laptops:"▰",Audio:"◉",TVs:"▣",Gaming:"✣",Appliances:"⌂"};

export default function Home(){
  const [category,setCategory]=useState("All"); const [query,setQuery]=useState(""); const [draft,setDraft]=useState(""); const [sort,setSort]=useState("recommended");
  const [managedProducts,setManagedProducts]=useState<Product[]>([]);
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
          listings: [{ store: "Amazon", affiliateUrl: product.outboundPath }, { store: "Flipkart" }],
          detailPath: product.detailPath,
        })));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  const allProducts=useMemo(()=>[...managedProducts,...products],[managedProducts]);
  const allCategories=useMemo(()=>["All",...Array.from(new Set(allProducts.map(product=>product.category)))],[allProducts]);
  const visible=useMemo(()=>{const term=query.trim().toLowerCase();const matches=allProducts.filter(p=>(category==="All"||p.category===category)&&(!term||`${p.name} ${p.category} ${p.summary} ${p.specs.join(" ")}`.toLowerCase().includes(term)));return sort==="name"?[...matches].sort((a,b)=>a.name.localeCompare(b.name)):matches},[allProducts,category,query,sort]);
  function search(e:FormEvent){e.preventDefault();setQuery(draft);document.querySelector("#catalog")?.scrollIntoView({behavior:"smooth"})}
  function reset(){setCategory("All");setQuery("");setDraft("")}
  return <main>
    <header className="topbar"><a className="brand" href="#top" aria-label="OfferLoom home"><span className="brandMark">O</span><span>Offer<span>Loom</span></span></a><nav aria-label="Main navigation"><a href="#catalog">Compare products</a><a href="#categories">Categories</a><a href="#how">How it works</a></nav><a className="alertButton" href="#catalog">Browse offers</a></header>
    <p className="amazonDisclosure">As an Amazon Associate I earn from qualifying purchases.</p>
    <section className="hero" id="top"><div className="heroCopy"><span className="eyebrow">INDIA-FIRST ELECTRONICS DISCOVERY</span><h1>Compare first.<br/><em>Choose better.</em></h1><p>Discover useful electronics, review shopping options in one place, and choose where you want to shop.</p><form className="search" onSubmit={search}><span aria-hidden="true">⌕</span><input value={draft} onChange={e=>setDraft(e.target.value)} aria-label="Search products" placeholder="Try laptop, 5G phone or earbuds…"/><button>Search products</button></form><div className="trust"><span>✓ Curated categories</span><span>↗ Direct merchant links</span><span>₹ No extra cost to shoppers</span></div></div>
      <div className="comparisonDemo" aria-label="Available merchant destinations"><div className="demoHeading"><span>SHOPPING OPTIONS</span><b>Amazon enabled</b></div><div className="demoProduct"><span>▯</span><div><strong>5G phone discovery</strong><small>Browse current options</small></div></div><div className="demoStore best"><div><strong>Amazon</strong><small>Approved affiliate destination</small></div><b>Available</b></div><div className="demoStore"><div><strong>Flipkart</strong><small>Affiliate access pending</small></div><b>Coming soon</b></div><p>Prices and availability are confirmed on the merchant website.</p></div></section>
    <section className="categoryStrip" id="categories"><div className="stripHeading"><div><span className="eyebrow">START BROWSING</span><h2>Shop by category</h2></div><p>Choose a category, then compare merchant listings side by side.</p></div><div className="categoryButtons">{categories.slice(1).map((item,i)=><button onClick={()=>{setCategory(item);setQuery("")}} key={item}><span>{["▯","▰","◉","▣","✣","⌂"][i]}</span>{item}</button>)}</div></section>
    <section className="catalog" id="catalog"><div className="catalogHead"><div><span className="eyebrow">EXPLORE THE MARKET</span><h2>Electronics catalogue</h2><p>Browse curated product groups, then check current selection, price and availability on the merchant website.</p></div><label>Sort products<select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recommended</option><option value="name">Name: A to Z</option></select></label></div>
      <div className="filterRow" role="group" aria-label="Product categories">{allCategories.map(item=><button className={category===item?"active":""} onClick={()=>setCategory(item)} key={item}>{item}</button>)}</div>{(query||category!=="All")&&<div className="resultSummary"><span>{visible.length} result{visible.length===1?"":"s"}{query?` for “${query}”`:""}</span><button onClick={reset}>Clear filters</button></div>}
      {visible.length?<div className="productGrid">{visible.map(product=><article className="productCard" key={product.id}><div className="productTop"><div className="productIcon" aria-hidden="true">{product.icon}</div><div><span className="categoryTag">{product.category}</span><h3>{product.detailPath?<Link href={product.detailPath}>{product.name}</Link>:product.name}</h3><p>{product.summary}</p></div></div><div className="specs">{product.specs.map(s=><span key={s}>{s}</span>)}</div>{product.detailPath&&<Link className="compareLink" href={product.detailPath}>Compare all stores →</Link>}<div className="listingTitle"><strong>Merchant destinations</strong><span>Links open merchant sites</span></div><div className="listings">{product.listings.map(listing=><div className={listing.affiliateUrl?"listing bestListing":"listing"} key={listing.store}><div><strong>{listing.store}</strong><small>{listing.affiliateUrl?"Affiliate link · current price on Amazon":"Affiliate access pending"}</small></div><div><b>{listing.affiliateUrl?"Check price":"Not available"}</b></div>{listing.affiliateUrl?<a className="listingLink" href={listing.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" aria-label={`Explore ${product.name} on Amazon`}>Explore <span aria-hidden="true">↗</span></a>:<button disabled aria-label={`${listing.store} partner link pending`}>Coming soon</button>}</div>)}</div></article>)}</div>:<div className="emptyState"><strong>No matching products yet</strong><p>Try a broader search or clear the selected category.</p><button onClick={reset}>Show all electronics</button></div>}
      <p className="disclosure"><strong>Affiliate and price notice:</strong> As an Amazon Associate I earn from qualifying purchases. Prices and availability can change at any time and are confirmed on Amazon.in. OfferLoom does not handle checkout, payment, shipping, cancellations, returns or refunds.</p></section>
    <section className="how" id="how"><div><span>01</span><h3>Find a category</h3><p>Search or browse electronics by category and useful specifications.</p></div><div><span>02</span><h3>Explore options</h3><p>Follow an approved link to review the merchant’s current products and prices.</p></div><div><span>03</span><h3>Shop with the merchant</h3><p>Amazon handles checkout, payment, delivery, cancellations and returns.</p></div></section>
  </main>
}
