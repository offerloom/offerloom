export type HeroCategorySlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  theme: string;
  image: string;
  imageAlt: string;
  filterCategory: string;
  searchTerm: string;
  amazonUrl: string;
  promo: {
    corner: string;
    badge: string;
    dealLine: string;
    extraTag: string;
    highlight: string;
    shopLabel: string;
    disclaimer: string;
  };
};

import { offerloomAmazonSearchPath } from "./amazon";

function amazonSearch(query: string) {
  return offerloomAmazonSearchPath(query);
}

const disclaimer = "*On selected partner store offers. Final price confirmed at checkout.";

export const heroCategorySlides: HeroCategorySlide[] = [
  {
    id: "mobiles-computers",
    eyebrow: "MOBILES & COMPUTERS",
    title: "Upgrade your everyday tech.",
    text: "Compare phones, laptops and accessories through approved shopping destinations.",
    cta: "Browse mobiles & computers",
    theme: "mobiles",
    image: "/hero/mobiles-computers.svg",
    imageAlt: "Mobile phones and laptops",
    filterCategory: "Electronics",
    searchTerm: "mobile phone laptop",
    amazonUrl: amazonSearch("mobiles computers"),
    promo: { corner: "5G", badge: "OfferLoom Tech Picks", dealLine: "Up to 55% off", extraTag: "Extra savings on phones & laptops", highlight: "5G phones · Laptops · Tablets", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "tv-appliances-electronics",
    eyebrow: "TV, APPLIANCES & ELECTRONICS",
    title: "Better picks for screens and appliances.",
    text: "Explore televisions, kitchen appliances and everyday electronics in one place.",
    cta: "Browse TVs & appliances",
    theme: "tv",
    image: "/hero/tv-appliances-electronics.svg",
    imageAlt: "Television and home appliances",
    filterCategory: "Electronics",
    searchTerm: "smart tv appliances",
    amazonUrl: amazonSearch("tv appliances electronics"),
    promo: { corner: "SALE", badge: "Home Entertainment", dealLine: "Up to 50% off", extraTag: "Smart TVs & appliance deals", highlight: "4K TVs · AC · Kitchen", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "mens-fashion",
    eyebrow: "MEN'S FASHION",
    title: "Sharp looks for every day.",
    text: "Discover clothing, footwear and accessories curated for men's wardrobes.",
    cta: "Shop men's fashion",
    theme: "mens",
    image: "/hero/mens-fashion.svg",
    imageAlt: "Men's fashion clothing and footwear",
    filterCategory: "Fashion",
    searchTerm: "men fashion",
    amazonUrl: amazonSearch("mens fashion"),
    promo: { corner: "NEW", badge: "Men's Style Edit", dealLine: "Min. 40% off", extraTag: "Everyday wardrobe refresh", highlight: "Shirts · Shoes · Watches", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "womens-fashion",
    eyebrow: "WOMEN'S FASHION",
    title: "Refresh your wardrobe for less.",
    text: "Browse clothing, footwear and accessories selected for everyday style.",
    cta: "Shop women's fashion",
    theme: "womens",
    image: "/hero/womens-fashion.svg",
    imageAlt: "Women's fashion clothing and accessories",
    filterCategory: "Fashion",
    searchTerm: "women fashion",
    amazonUrl: amazonSearch("womens fashion"),
    promo: { corner: "HOT", badge: "Festive Fashion Edit", dealLine: "40–70% off", extraTag: "Curated ethnic & everyday wear", highlight: "Dresses · Handbags · Footwear", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "home-kitchen-pets",
    eyebrow: "HOME, KITCHEN & PETS",
    title: "Make every room work better.",
    text: "Find practical home, kitchen and pet essentials without scattered searching.",
    cta: "Browse home & kitchen",
    theme: "home",
    image: "/hero/home-kitchen-pets.svg",
    imageAlt: "Home, kitchen and pet essentials",
    filterCategory: "Home",
    searchTerm: "home kitchen pets",
    amazonUrl: amazonSearch("home kitchen pets"),
    promo: { corner: "HOME", badge: "Home Essentials", dealLine: "Up to 45% off", extraTag: "Kitchen, decor & pet care", highlight: "Appliances · Decor · Pet care", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "beauty-health-grocery",
    eyebrow: "BEAUTY, HEALTH & GROCERY",
    title: "Daily care and pantry picks.",
    text: "Explore beauty, wellness and grocery collections through approved stores.",
    cta: "Browse beauty & grocery",
    theme: "beauty",
    image: "/hero/beauty-health-grocery.svg",
    imageAlt: "Beauty, health and grocery products",
    filterCategory: "All",
    searchTerm: "beauty health grocery",
    amazonUrl: amazonSearch("beauty health grocery"),
    promo: { corner: "CARE", badge: "Daily Essentials", dealLine: "Up to 50% off", extraTag: "Beauty, wellness & grocery", highlight: "Skincare · Wellness · Pantry", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "sports-fitness-bags",
    eyebrow: "SPORTS, FITNESS & BAGS",
    title: "Gear up and go further.",
    text: "Discover sports, fitness and luggage collections for active lifestyles.",
    cta: "Browse sports & bags",
    theme: "sports",
    image: "/hero/sports-fitness-bags.svg",
    imageAlt: "Sports gear, fitness equipment and bags",
    filterCategory: "All",
    searchTerm: "sports fitness bags luggage",
    amazonUrl: amazonSearch("sports fitness bags luggage"),
    promo: { corner: "FIT", badge: "Active Lifestyle", dealLine: "Up to 40% off", extraTag: "Sports gear & travel bags", highlight: "Fitness · Sports · Luggage", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "toys-baby-kids",
    eyebrow: "TOYS, BABY & KIDS' FASHION",
    title: "Delightful picks for little ones.",
    text: "Browse toys, baby products and kids' fashion through trusted destinations.",
    cta: "Browse toys & baby",
    theme: "kids",
    image: "/hero/toys-baby-kids.svg",
    imageAlt: "Toys, baby products and kids fashion",
    filterCategory: "All",
    searchTerm: "toys baby kids fashion",
    amazonUrl: amazonSearch("toys baby kids fashion"),
    promo: { corner: "KIDS", badge: "Family Favourites", dealLine: "Up to 55% off", extraTag: "Toys, baby & kids' fashion", highlight: "Toys · Baby · Kids wear", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "car-motorbike-industrial",
    eyebrow: "CAR, MOTORBIKE & INDUSTRIAL",
    title: "Tools and rides, sorted simply.",
    text: "Explore automotive, motorbike and industrial essentials in curated collections.",
    cta: "Browse auto & industrial",
    theme: "auto",
    image: "/hero/car-motorbike-industrial.svg",
    imageAlt: "Car, motorbike and industrial products",
    filterCategory: "All",
    searchTerm: "car motorbike industrial",
    amazonUrl: amazonSearch("car motorbike industrial"),
    promo: { corner: "AUTO", badge: "Ride & Tools", dealLine: "Top deals", extraTag: "Car care & industrial picks", highlight: "Car care · Bike · Tools", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "books",
    eyebrow: "BOOKS",
    title: "Your next great read awaits.",
    text: "Discover books across genres through approved shopping destinations.",
    cta: "Browse books",
    theme: "books",
    image: "/hero/books.svg",
    imageAlt: "Books and reading collections",
    filterCategory: "All",
    searchTerm: "books",
    amazonUrl: amazonSearch("books"),
    promo: { corner: "READ", badge: "Book Bazaar", dealLine: "Up to 60% off", extraTag: "Bestsellers & study picks", highlight: "Fiction · Study · Bestsellers", shopLabel: "SHOP NOW", disclaimer },
  },
  {
    id: "movies-music-games",
    eyebrow: "MOVIES, MUSIC & VIDEO GAMES",
    title: "Entertainment picks you'll love.",
    text: "Explore movies, music and gaming collections selected for Indian shoppers.",
    cta: "Browse entertainment",
    theme: "entertainment",
    image: "/hero/movies-music-games.svg",
    imageAlt: "Movies, music and video games",
    filterCategory: "Gaming",
    searchTerm: "movies music video games",
    amazonUrl: amazonSearch("movies music video games"),
    promo: { corner: "PLAY", badge: "Entertainment Zone", dealLine: "Up to 50% off", extraTag: "Games, movies & music", highlight: "Games · Music · Movies", shopLabel: "SHOP NOW", disclaimer },
  },
];

export type ShopCategoryTile = {
  id: string;
  name: string;
  icon: string;
  theme: string;
  image: string;
  amazonUrl: string;
};

const shopTileMeta: Record<string, { name: string; icon: string; keywords: string[] }> = {
  "mobiles-computers": { name: "Mobiles & PCs", icon: "▯", keywords: ["mobile", "phone", "laptop", "computer", "tablet"] },
  "tv-appliances-electronics": { name: "TVs & appliances", icon: "▣", keywords: ["tv", "television", "appliance", "audio", "gaming", "console"] },
  "mens-fashion": { name: "Men's fashion", icon: "♂", keywords: ["men", "fashion", "shirt", "shoe"] },
  "womens-fashion": { name: "Women's fashion", icon: "♢", keywords: ["women", "fashion", "dress", "handbag"] },
  "home-kitchen-pets": { name: "Home & kitchen", icon: "⌂", keywords: ["home", "kitchen", "appliance", "pet"] },
  "beauty-health-grocery": { name: "Beauty & grocery", icon: "✿", keywords: ["beauty", "health", "grocery", "skincare"] },
  "sports-fitness-bags": { name: "Sports & bags", icon: "⚡", keywords: ["sport", "fitness", "bag", "luggage"] },
  "toys-baby-kids": { name: "Toys & baby", icon: "★", keywords: ["toy", "baby", "kids", "kid"] },
  "car-motorbike-industrial": { name: "Auto & tools", icon: "⚙", keywords: ["car", "bike", "motorbike", "industrial", "tool"] },
  books: { name: "Books", icon: "≡", keywords: ["book", "read", "novel"] },
  "movies-music-games": { name: "Movies & games", icon: "✣", keywords: ["game", "gaming", "movie", "music", "console"] },
};

export const shopCategoryTiles: ShopCategoryTile[] = [
  ...heroCategorySlides.map((slide) => ({
    id: slide.id,
    name: shopTileMeta[slide.id]?.name ?? slide.eyebrow,
    icon: shopTileMeta[slide.id]?.icon ?? "◇",
    theme: slide.theme,
    image: slide.image,
    amazonUrl: slide.amazonUrl,
  })),
  {
    id: "all-deals",
    name: "All deals",
    icon: "✦",
    theme: "brand",
    image: "/hero/mobiles-computers.svg",
    amazonUrl: amazonSearch("deals"),
  },
];
