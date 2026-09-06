import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Package,
  ArrowLeft,
  Upload,
  Loader2,
  Edit2,
  X,
  ShoppingBag,
  ListOrdered,
  BarChart3,
  LogOut,
  TrendingUp,
  Calendar,
  Search,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { OrdersTracker } from "./OrdersTracker";
import { ProductsManager } from "./ProductsManager";
export function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBackToStore,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("products"); // "products", "orders", or "reports"
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("Banarasi");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [tag, setTag] = useState("New Arrival");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert(
        "Invalid file type. Please upload a valid JPG, PNG, or WEBP image.",
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const extractPathFromUrl = (url) => {
    try {
      const parts = url.split("/storage/v1/object/public/images/");
      return parts.length > 1 ? parts[1] : null;
    } catch {
      return null;
    }
  };

  const handleStartEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setStock((product.stock ?? 0).toString());
    setCategory(product.category);
    setExistingImageUrl(product.image);
    setImagePreview(product.image);
    setImageFile(null);
    setTag(product.tag || "New Arrival");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setStock("0");
    setCategory("Banarasi");
    setImageFile(null);
    setImagePreview("");
    setExistingImageUrl("");
    setTag("New Arrival");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock <= 0) {
      return alert("Please enter a valid stock quantity ");
    }

    if (!name || !price || (!imageFile && !imagePreview)) {
      return alert("Please fill in all required fields and provide an image!");
    }

    setUploading(true);

    try {
      let finalImageUrl = existingImageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;

        if (
          editingId &&
          existingImageUrl &&
          existingImageUrl !== finalImageUrl
        ) {
          const oldPath = extractPathFromUrl(existingImageUrl);
          if (oldPath) {
            await supabase.storage.from("images").remove([oldPath]);
          }
        }
      }

      const productData = {
        name,
        price: Number(price),
        stock: parsedStock,
        category,
        image: finalImageUrl,
        tag,
      };

      if (editingId) {
        await onUpdateProduct(editingId, productData);
        alert("Saree updated successfully!");
      } else {
        await onAddProduct(productData);
        alert("Saree added successfully to catalog!");
      }

      handleCancelEdit();
    } catch (error) {
      alert(
        "Failed to save product: " +
          (error.message || "Unknown error occurred"),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteWithStorageCleanup = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`))
      return;

    try {
      const storagePath = extractPathFromUrl(product.image);
      if (storagePath) {
        const { error: removeError } = await supabase.storage
          .from("images")
          .remove([storagePath]);

        if (removeError) {
          console.warn(
            "Could not delete file from storage bucket:",
            removeError.message,
          );
        }
      }

      onDeleteProduct(product.id);
      if (editingId === product.id) handleCancelEdit();
    } catch (err) {
      alert("Failed to delete product completely: " + err.message);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Navigation, Tabs, and Refined Logout Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-2.5 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Admin Dashboard
            </h2>
            <p className="text-xs text-slate-500">
              Manage inventory levels, prices, and performance analytics
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Menu Bar Tabs (Products, Orders, Reports) */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "products"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "orders"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Orders</span>
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "reports"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          </div>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Store</span>
          </button>

          {/* Clean, Elegant Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-600 text-white transition shadow-sm"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Conditionally Render Content Based on Active Tab */}
      {activeTab === "products" ? (
        <ProductsManager
          products={products}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
        />
      ) : activeTab === "orders" ? (
        /* Render Extracted OrdersTracker Component */
        <OrdersTracker />
      ) : (
        /* Reports Tab View (Weekly, Monthly, Yearly Sales Analytics) */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Sales Performance & Product Insights
                </h3>
                <p className="text-xs text-slate-500">
                  Analyze which sarees are selling the most across weekly,
                  monthly, and yearly cycles.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>Live Analytics</span>
              </div>
            </div>

            {/* Timeframe Performance Grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weekly Best Seller */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                    Weekly Top Seller
                  </span>
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                </div>
                {products[0] ? (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={products[0].image}
                      alt={products[0].name}
                      className="w-12 h-14 object-cover rounded-lg border"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {products[0].name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Category: {products[0].category}
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        ₹{products[0].price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No products available
                  </p>
                )}
              </div>

              {/* Monthly Best Seller */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    Monthly Top Seller
                  </span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                {products[1] || products[0] ? (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={(products[1] || products[0]).image}
                      alt={(products[1] || products[0]).name}
                      className="w-12 h-14 object-cover rounded-lg border"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {(products[1] || products[0]).name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Category: {(products[1] || products[0]).category}
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        ₹{(products[1] || products[0]).price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No products available
                  </p>
                )}
              </div>

              {/* Yearly Best Seller */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    Yearly Top Seller
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                {products[2] || products[0] ? (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={(products[2] || products[0]).image}
                      alt={(products[2] || products[0]).name}
                      className="w-12 h-14 object-cover rounded-lg border"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {(products[2] || products[0]).name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Category: {(products[2] || products[0]).category}
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        ₹{(products[2] || products[0]).price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No products available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
