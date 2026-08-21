const deals = [
  { icon: "◫", name: "Smartphone 5G", price: "₹18,999", old: "₹24,999", off: "24% off", store: "Flipkart" },
  { icon: "⌨", name: "Performance Laptop", price: "₹52,490", old: "₹64,990", off: "19% off", store: "Amazon" },
  { icon: "◉", name: "Noise-cancelling Earbuds", price: "₹2,499", old: "₹4,999", off: "50% off", store: "Flipkart" },
  { icon: "▣", name: "4K Smart Television", price: "₹31,990", old: "₹44,990", off: "29% off", store: "Amazon" },
];

const categories = ["Mobiles", "Laptops", "Audio", "TVs", "Gaming", "Appliances"];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="OfferLoom home">
          <span className="brandMark">O</span><span>Offer<span>Loom</span></span>
        </a>
        <nav aria-label="Main navigation"><a href="#deals">Top deals</a><a href="#categories">Categories</a><a href="#how">How it works</a></nav>
        <button className="alertButton">Get deal alerts</button>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">SMARTER SHOPPING STARTS HERE</span>
          <h1>Every deal.<br /><em>One destination.</em></h1>
          <p>Compare electronics offers across trusted stores and find the price worth buying—without opening ten tabs.</p>
          <form className="search" action="#deals">
            <span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search mobiles, laptops, headphones…" /><button type="submit">Find deals</button>
          </form>
          <div className="trust"><span>✓ Verified offers</span><span>↻ Prices refreshed regularly</span><span>₹ No extra cost</span></div>
        </div>
        <div className="heroVisual" aria-label="Illustration of comparing store prices">
          <div className="miniCard cardBack"><small>OTHER PRICE</small><strong>₹24,999</strong></div>
          <div className="productOrb"><span>◫</span></div>
          <div className="miniCard cardFront"><small>BEST PRICE</small><strong>₹18,999</strong><b>You save ₹6,000</b></div>
          <div className="spark sparkOne">✦</div><div className="spark sparkTwo">✦</div>
        </div>
      </section>

      <section className="categoryStrip" id="categories">
        <strong>Shop by category</strong>
        <div>{categories.map((item, index) => <a href="#deals" key={item}><span>{["▯","▰","◉","▣","✣","⌂"][index]}</span>{item}</a>)}</div>
      </section>

      <section className="deals" id="deals">
        <div className="sectionHead"><div><span className="eyebrow">CURATED TODAY</span><h2>Deals worth your attention</h2></div><a href="#">View all deals →</a></div>
        <div className="dealGrid">
          {deals.map((deal) => <article className="dealCard" key={deal.name}>
            <div className="dealImage"><span>{deal.icon}</span><b>{deal.off}</b></div><small>Available on {deal.store}</small><h3>{deal.name}</h3>
            <div className="price"><strong>{deal.price}</strong><s>{deal.old}</s></div><button>View deal <span>↗</span></button>
          </article>)}
        </div>
        <p className="disclosure">Prices are examples for this preview. Final prices and availability are confirmed on the retailer’s website.</p>
      </section>

      <section className="how" id="how">
        <div><span>01</span><h3>We gather</h3><p>Offers from trusted shopping partners.</p></div>
        <div><span>02</span><h3>We compare</h3><p>Prices and discounts in one clean view.</p></div>
        <div><span>03</span><h3>You decide</h3><p>Visit the store offering the best value.</p></div>
      </section>
    </main>
  );
}
