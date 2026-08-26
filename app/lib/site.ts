export const SITE = {
  brand: "OfferLoom",
  tagline: "Every Deal. One Destination.",
  legalEntity: "Parthsheel Enterprises",
  contactEmail: "contact.offerloom@gmail.com",
  amazonStoreId: "offerloom-21",
  country: "India",
} as const;

export const COMMUNITY = {
  hook: "Join us for daily exciting deals — free alerts, zero spam.",
  instagram: {
    url: "https://www.instagram.com/offer.loom/",
    buttonText: "Follow daily deals",
    via: "Instagram · Free",
  },
  whatsapp: {
    url: "https://whatsapp.com/channel/0029VbD63wj6RGJ94VedZ42W",
    buttonText: "Join for daily deals",
    via: "WhatsApp Channel · Free",
    cta: "Join free",
  },
  telegram: {
    url: "https://t.me/+918127088087",
    buttonText: "Join for daily deals",
    via: "Telegram · Free",
    cta: "Join free",
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
