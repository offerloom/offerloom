export type BuyingGuide = {
  slug: string;
  title: string;
  department: string;
  summary: string;
  readMinutes: number;
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
};

export const BUYING_GUIDES: BuyingGuide[] = [
  {
    slug: "electronics",
    title: "Electronics buying guide for Indian shoppers",
    department: "Electronics",
    summary: "Practical questions to ask before buying phones, laptops, audio gear, televisions or gaming products in India.",
    readMinutes: 8,
    sections: [
      {
        heading: "Start with your real use case",
        paragraphs: [
          "Electronics purchases last for years, so begin with how you will actually use the device. A student who needs long battery life and a comfortable keyboard has different priorities from a creator who edits video or a family that wants a large television for streaming.",
          "Write down your must-have features, nice-to-have features and absolute deal-breakers before comparing models.",
        ],
      },
      {
        heading: "Mobile phones",
        paragraphs: ["For most buyers in India, these checks matter more than chasing the highest model number."],
        bullets: [
          "5G band support for your city and carrier",
          "Battery capacity and real-world charging speed",
          "Software update policy and bloatware level",
          "Display quality outdoors and repair availability",
          "Storage variant that will still feel adequate in two years",
        ],
      },
      {
        heading: "Laptops",
        paragraphs: ["Match the configuration to the workload instead of buying more than you need."],
        bullets: [
          "16 GB RAM is a sensible baseline for multitasking and browser-heavy work",
          "SSD storage improves everyday responsiveness more than marginal CPU gains",
          "Check port selection, webcam quality and hinge build",
          "For creative work, verify GPU requirements for your software",
          "Compare warranty terms and authorised service coverage in your city",
        ],
      },
      {
        heading: "Audio, TVs and gaming",
        paragraphs: [
          "For earbuds and headphones, comfort, call quality and codec support often matter as much as advertised battery hours.",
          "For televisions, room size, viewing distance and panel type affect value more than marketing labels alone.",
          "For consoles or gaming accessories, confirm game-library preference, storage expansion and controller comfort before buying.",
        ],
      },
      {
        heading: "Before you checkout",
        paragraphs: [
          "Confirm the seller, warranty type, return window and current price on the merchant website. OfferLoom helps you narrow choices; the merchant confirms the live offer.",
        ],
      },
    ],
  },
  {
    slug: "fashion",
    title: "Fashion buying guide for everyday wardrobes",
    department: "Fashion",
    summary: "How to shop smarter for clothing, footwear and accessories without overbuying trends you will not wear.",
    readMinutes: 6,
    sections: [
      {
        heading: "Build around staples first",
        paragraphs: [
          "A useful wardrobe starts with versatile basics: well-fitting jeans or trousers, neutral tops, comfortable footwear and season-appropriate outer layers.",
          "Trend-led pieces can be added after the core fits your routine, climate and workplace dress code.",
        ],
      },
      {
        heading: "Fit and fabric matter more than photos",
        paragraphs: [
          "Product photos are styled for appeal. Check size charts, fabric composition, stretch, lining and care instructions before ordering.",
        ],
        bullets: [
          "Cotton blends breathe well for daily wear in warm weather",
          "Look for lining or opacity notes on light-coloured garments",
          "Compare heel height, sole grip and width for footwear",
          "Read reviews about sizing running small or large when available on the merchant site",
        ],
      },
      {
        heading: "Season and occasion planning",
        paragraphs: [
          "Buy for the climate you live in, not only for the season shown in marketing images. Festive outfits, office formals and casual weekend wear solve different problems and should be compared separately.",
        ],
      },
      {
        heading: "Returns and exchanges",
        paragraphs: [
          "Fashion purchases depend heavily on fit. Prefer merchants with clear try-and-return policies, and inspect tags, stitching and colour under natural light as soon as the package arrives.",
        ],
      },
    ],
  },
  {
    slug: "home",
    title: "Home and appliances buying guide",
    department: "Home",
    summary: "Questions to ask before buying refrigerators, washing machines and other home appliances for Indian households.",
    readMinutes: 7,
    sections: [
      {
        heading: "Measure your space before you shop",
        paragraphs: [
          "Appliances fail in real homes when door swing, ventilation clearance, plug location or cabinet width are ignored.",
          "Measure the installation area twice and note access paths for delivery.",
        ],
      },
      {
        heading: "Energy use and running costs",
        paragraphs: [
          "A lower upfront price can cost more over years of electricity use. Compare energy-efficiency labels, inverter technology where relevant and expected daily usage for your household size.",
        ],
        bullets: [
          "Refrigerator capacity should match family size and shopping habits",
          "Washing-machine load capacity depends on weekly laundry volume",
          "Check voltage stabiliser requirements in your area",
          "Confirm installation, demo and warranty registration support",
        ],
      },
      {
        heading: "Service network and spare parts",
        paragraphs: [
          "An appliance is only as good as local service coverage. Before buying, check authorised service availability in your city and whether extended warranty options are worth the premium for your use case.",
        ],
      },
      {
        heading: "Delivery and installation checks",
        paragraphs: [
          "On delivery day, inspect for transit damage, verify model number against your order, and run a basic function test during installation when the technician is present.",
        ],
      },
    ],
  },
];

export function getBuyingGuide(slug: string): BuyingGuide | undefined {
  return BUYING_GUIDES.find((guide) => guide.slug === slug);
}
