export const PRODUCTS = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  name: `Designer Silk Saree #${index + 1}`,
  price: 2499 + index * 75,
  category: index % 2 === 0 ? "Banarasi" : "Kanjivaram",
  image: `https://picsum.photos/seed/saree${index + 1}/400/500`,
  tag: index % 3 === 0 ? "Best Seller" : "New Arrival",
}));
