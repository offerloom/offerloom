export const SITE = {
  brand: "OfferLoom",
  tagline: "Every Deal. One Destination.",
  legalEntity: "Parthsheel Enterprises",
  contactEmail: "contact.offerloom@gmail.com",
  amazonStoreId: "offerloom-21",
  country: "India",
  publicUrl: "https://offerloom.contact-offerloom.workers.dev",
} as const;

export const COMMUNITY = {
  hook: "Follow OfferLoom on Facebook for our latest deals.",
  whatsapp: {
    url: "https://whatsapp.com/channel/0029VbD63wj6RGJ94VedZ42W",
    buttonText: "Join for daily deals",
    via: "WhatsApp Channel · Free",
    cta: "Join free",
  },
  facebook: {
    url: "https://www.facebook.com/1220668387806265",
    buttonText: "Follow our page",
    via: "Facebook · OfferLoom",
  },
} as const;

export const SOCIAL_LINKS = [
  {
    id: "facebook",
    label: "OfferLoom on Facebook",
    href: "https://www.facebook.com/1220668387806265",
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
