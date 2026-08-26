export const SITE = {
  brand: "OfferLoom",
  tagline: "Every Deal. One Destination.",
  legalEntity: "Parthsheel Enterprises",
  contactEmail: "contact.offerloom@gmail.com",
  amazonStoreId: "offerloom-21",
  country: "India",
} as const;

export const COMMUNITY = {
  quote: "Every Deal. One Destination. — get curated picks before they sell out.",
  whatsapp: {
    url: "https://wa.me/",
    headline: "Get every deal first on WhatsApp",
    subtext: "Free channel — price drops, coupons and curated picks the moment they land.",
    cta: "Join free",
  },
  telegram: {
    url: "https://t.me/offerloom",
    headline: "Daily deals on Telegram",
    subtext: "Quick alerts for flash sales, bank offers and category highlights.",
    cta: "Join channel",
  },
} as const;

export const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "OfferLoom on Instagram",
    href: "https://www.instagram.com/offer.loom/",
  },
  {
    id: "youtube",
    label: "OfferLoom on YouTube",
    href: "https://www.youtube.com/@offerloom",
  },
  {
    id: "facebook",
    label: "OfferLoom on Facebook",
    href: "https://www.facebook.com/profile.php?id=61593570969974",
  },
  {
    id: "x",
    label: "OfferLoom on X",
    href: "https://x.com/offerloom",
  },
] as const;

export const FOOTER_LINKS = {
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/guides", label: "Buying guides" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/terms", label: "Terms and Conditions" },
    { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
    { href: "/price-disclaimer", label: "Price and Availability" },
    { href: "/advertising-disclosure", label: "Advertising Disclosure" },
    { href: "/merchant-checkout", label: "Checkout and Returns" },
    { href: "/grievance", label: "Grievance Officer" },
  ],
} as const;
