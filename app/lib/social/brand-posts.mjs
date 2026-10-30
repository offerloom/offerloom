// Alternate-day OfferLoom brand posts: one quote card per post, each used once before any repeats.
// Images are pre-rendered to public/brand/posts/NN.jpg (PNG, then converted to JPEG) by scripts/brand-cards/render.mjs.
export const BRAND_POSTS = [
  ["Same product. Different prices. We find the lowest.", "Compare Amazon, Flipkart, Myntra, AJIO & Croma in one place."],
  ["Stop opening 5 apps to find one deal.", "OfferLoom checks the stores so you don't have to."],
  ["Smart shoppers compare. Smarter ones use OfferLoom.", "Price comparison across India's top stores, free."],
  ["Your cart deserves a better price.", "See every store's price side by side before you buy."],
  ["Don't pay MRP. Ever.", "Daily verified discounts, checked by OfferLoom."],
  ["Every rupee saved is a rupee earned.", "Find the cheapest store for what you already want."],
  ["Deals change daily. So do we.", "Fresh discounts updated every morning and evening."],
  ["Shop once. Save every time.", "Bookmark OfferLoom before your next purchase."],
  ["The best deal isn't always on the first app you open.", "We compare so your wallet doesn't have to."],
  ["Less scrolling. More saving.", "Today's top discounts, all on one page."],
  ["Why overpay when you can compare?", "Amazon vs Flipkart vs more — instantly."],
  ["Checked prices. Real discounts. No noise.", "Every deal on OfferLoom shows when its price was checked."],
  ["Discount hunting, done for you.", "Your daily shortcut to India's best online offers."],
  ["Same phone. ₹2,000 cheaper on another store?", "That's exactly what OfferLoom is for."],
  ["Wishlist today. Best price tomorrow.", "Check OfferLoom before you hit Buy Now."],
  ["One site. Six stores. Zero guesswork.", "Amazon · Flipkart · Myntra · AJIO · Croma · Amway"],
  ["Saving money is a skill. We make it easy.", "Compare prices in seconds on OfferLoom."],
  ["Deal of the Day, every day.", "Our top verified discount, picked fresh daily."],
  ["Good taste. Better price.", "Fashion deals from Myntra & AJIO, compared."],
  ["Upgrade your gadgets, not your bill.", "Electronics deals from Amazon, Flipkart & Croma."],
  ["Think before you checkout.", "A 10-second price check can save you hundreds."],
  ["Real discounts are worth sharing.", "Send OfferLoom to the friend who always overpays."],
  ["Big sale? Compare anyway.", "Not every 'sale' price is the lowest price."],
  ["Spend smart. Live better.", "OfferLoom — India's daily deal finder."],
  ["Your money. Your rules. Our deals.", "Free to use. No sign-up needed."],
  ["Before you buy, OfferLoom it.", "The habit that pays for itself."],
  ["Prices drop when you're not looking. We're looking.", "Deals checked twice a day."],
  ["Bestsellers at their best prices.", "Popular picks, compared across stores."],
  ["Shopping is fun. Overpaying isn't.", "Find today's lowest price on OfferLoom."],
  ["From must-haves to nice-to-haves — for less.", "Electronics, fashion, home & more."],
  ["Save on what you love.", "Thousands of products, compared daily."],
  ["The cheapest store changes every day.", "OfferLoom tells you which one it is today."],
  ["Coffee money saved on every order.", "Small savings add up — compare before you buy."],
  ["Trust the price check, not the price tag.", "We show the real price from each store."],
  ["Discounts you can actually trust.", "Verified MRP and selling price on every deal."],
  ["Festive shopping? Start here.", "Compare festive offers across stores in one place."],
  ["Gift better. Spend less.", "Find gifts at their best price on OfferLoom."],
  ["New launches, best prices.", "Fresh arrivals compared across top stores."],
  ["Deals for every budget.", "From ₹199 finds to big-ticket steals."],
  ["Your shopping buddy that never sleeps.", "Prices refreshed every morning and evening."],
  ["Click less. Save more.", "Everything you need to compare, on one page."],
  ["Why choose one store when you can compare all?", "OfferLoom puts them side by side."],
  ["Bargain hunters, this one's for you.", "Today's biggest discounts, ranked."],
  ["Make every purchase a smart purchase.", "Compare first, then buy with confidence."],
  ["Don't just shop. Shop smart.", "OfferLoom — compare, save, repeat."],
  ["Today's deal could be gone tomorrow.", "Check the latest offers on OfferLoom now."],
  ["Discover deals you'd never find alone.", "Hand-checked offers from India's top stores."],
  ["Lowest price wins. Always.", "We highlight the best price for every product."],
  ["Shopping made simple.", "Search, compare and shop on the merchant's site."],
  ["The smartest tab to open before shopping.", "offerloom.offerloom.workers.dev"],
  ["Smart savings start here.", "Free daily price comparison for India."],
  ["One check. Real savings.", "See every store's price before you pay."],
  ["Love a good deal? So do we.", "Follow OfferLoom for daily offers."],
  ["Beauty, wellness & home — for less.", "Including Persona, Glister & Satinique by Amway."],
  ["Stop guessing. Start comparing.", "Real prices from real stores, updated daily."],
  ["A better price is just one tap away.", "Find it on OfferLoom."],
  ["Shop the same. Pay less.", "That's the OfferLoom promise."],
  ["Discounts curated, not cluttered.", "Only real deals with real price checks."],
  ["Every day is a sale day somewhere.", "We find where — so you save."],
  ["Follow for deals. Stay for savings.", "New offers every single day."],
];

// Hashtag pool: core brand tags always, plus a rotating set so each post's tags differ.
const CORE_TAGS = ["#OfferLoom", "#DailyDeals", "#IndiaDeals", "#PriceComparison", "#SmartShopping", "#SaveMoney"];
const ROTATING_TAGS = ["#DealsOfTheDay", "#OnlineShopping", "#ShoppingIndia", "#BudgetShopping", "#MoneySavingTips", "#ShopSmart",
  "#BestDeals", "#DealAlert", "#OffersIndia", "#DiscountDeals", "#Sale", "#ShoppingTips", "#AmazonDeals", "#FlipkartDeals",
  "#MyntraFinds", "#AjioLove", "#LootDeals", "#BudgetFinds", "#FrugalLiving", "#ShoppingAddict", "#TrendingNow",
  "#InstaShopping", "#ViralDeals", "#Explore", "#ExplorePage", "#Reels", "#IndianShopping", "#OnlineDeals"];

export function brandHashtags(index) {
  const picked = [];
  for (let i = 0; i < 12; i += 1) picked.push(ROTATING_TAGS[(index * 7 + i * 5) % ROTATING_TAGS.length]);
  return [...new Set([...CORE_TAGS, ...picked])].slice(0, 20).join(" ");
}

export const brandImagePath = (index) => `/brand/posts/${String(index + 1).padStart(2, "0")}.jpg`;
export const brandHeadline = (index) => `Brand post ${index + 1}: ${BRAND_POSTS[index][0]}`;

export function brandCaption(index, siteUrl) {
  const [quote, line] = BRAND_POSTS[index];
  return [`✨ ${quote}`, line, `🔎 Compare prices free: ${siteUrl}`, brandHashtags(index)].join("\n\n");
}

/** Brand posts run on alternate days (even days since 1970, IST). */
export function isBrandDay(now = Date.now()) {
  return Math.floor((now + 19800000) / 86400000) % 2 === 0;
}

/** Next card: the one never posted, else the one posted longest ago. `lastPosted` maps index -> ISO time. */
export function nextBrandIndex(lastPosted) {
  let best = 0, bestTime = Infinity;
  for (let i = 0; i < BRAND_POSTS.length; i += 1) {
    const t = lastPosted.has(i) ? Date.parse(lastPosted.get(i)) : -Infinity;
    if (t < bestTime) { best = i; bestTime = t; }
  }
  return best;
}
