const CATEGORY_ORDER = ["Electronics", "Fashion", "Sports", "Home", "Toys", "Books", "Beauty", "Auto"];

export function orderProductCategories(categories) {
  const uniqueCategories = [...new Set(categories.filter((category) => typeof category === "string" && category.trim()))];
  return uniqueCategories.sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a);
    const bIndex = CATEGORY_ORDER.indexOf(b);
    if (aIndex < 0 && bIndex < 0) return a.localeCompare(b);
    if (aIndex < 0) return 1;
    if (bIndex < 0) return -1;
    return aIndex - bIndex;
  });
}

export function productCategorySectionId(category) {
  const slug = category.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `product-category-${slug || "other"}`;
}
