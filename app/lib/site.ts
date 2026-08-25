export const SITE = {
  brand: "OfferLoom",
  tagline: "Every Deal. One Destination.",
  legalEntity: "Parthsheel Enterprises",
  contactEmail: "contact.offerloom@gmail.com",
  amazonStoreId: "offerloom-21",
  country: "India",
} as const;

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
