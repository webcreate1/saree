import React, { useState } from "react";
import { useProducts } from "./hooks/useProducts";
import { useCart } from "./hooks/useCart";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { CartDrawer } from "./components/CartDrawer";
import { AdminPanel } from "./components/AdminPanel";
import { Phone, MessageCircle, Store, ShieldCheck } from "lucide-react";
import "./styles/animations.css";

export default function App() {
  const {
    products,
    addProduct,
    deleteProduct,
    updateProduct,
    checkStockAvailability,
    decreaseStock,
  } = useProducts();

  const { cart, addToCart, removeFromCart, calculateTotal, updateQuantity } =
    useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const PHONE_NUMBER = "919876543210";
  const CATEGORIES = ["All", "Banarasi", "Kanjivaram", "Chanderi"];

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        phoneNumber={PHONE_NUMBER}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
      />

      {isAdminView ? (
        <AdminPanel
          products={products}
          onAddProduct={addProduct}
          onDeleteProduct={deleteProduct}
          onBackToStore={() => setIsAdminView(false)}
          onUpdateProduct={updateProduct}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Professional Business Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <Store className="w-64 h-64 text-white" />
            </div>

            <div className="space-y-2 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Handloom
                Boutique
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Exquisite Traditional Sarees
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                Directly sourced from master weavers. Experience authentic
                Banarasi, Kanjivaram, and Chanderi silks with guaranteed purity.
                Connect with us directly for custom styling or bulk inquiries.
              </p>
            </div>

            <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-center">
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition shadow-sm"
              >
                <Phone className="w-4 h-4 text-rose-400" />
                <span>Call Store</span>
              </a>
              <a
                href={`https://wa.me/${PHONE_NUMBER}?text=Hi,%20I%20am%20interested%20in%20your%20saree%20collection.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/40"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>

          {/* Collection Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Festive Collection ({products.length} Items)
              </h2>
              <p className="text-sm text-slate-500">
                Tap 'Add to Cart' and instantly complete your purchase via
                WhatsApp.
              </p>
            </div>

            {/* Responsive Filters: Dropdown for Mobile, Pills for Desktop */}
            <div className="w-full md:w-auto">
              {/* Mobile Select Dropdown */}
              <div className="block md:hidden">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 shadow-sm focus:outline-rose-600"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "All" ? "All Sarees" : `${cat} Sarees`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Pill Tabs */}
              <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {cat} Sarees
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onAddToCart={(prod) => {
                  addToCart(prod);
                  //setIsCartOpen(true);
                }}
              />
            ))}
          </div>
        </main>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        total={calculateTotal()}
        phoneNumber={PHONE_NUMBER}
        onUpdateQuantity={updateQuantity}
        onCheckStock={checkStockAvailability}
        onDecreaseStock={decreaseStock}
      />
    </div>
  );
}
