import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Edit2,
  X,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function ProductsManager({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("Banarasi");
  const [isActive, setIsActive] = useState(true);
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
    setBuyPrice(product.buy_price ? product.buy_price.toString() : "");
    setStock((product.stock ?? 0).toString());
    setCategory(product.category);
    setIsActive(product.is_active ?? true);
    setExistingImageUrl(product.image);
    setImagePreview(product.image);
    setImageFile(null);
    setTag(product.tag || "New Arrival");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setBuyPrice("");
    setStock("0");
    setCategory("Banarasi");
    setIsActive(true);
    setImageFile(null);
    setImagePreview("");
    setExistingImageUrl("");
    setTag("New Arrival");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return alert("Please enter a valid stock quantity.");
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
        buy_price: buyPrice ? Number(buyPrice) : null,
        stock: parsedStock,
        category,
        image: finalImageUrl,
        tag,
        is_active: isActive,
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
      {/* Form Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">
            {editingId ? "Edit Saree Details" : "Add New Saree"}
          </h3>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="text-xs flex items-center gap-1 text-rose-600 hover:underline font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Saree Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Royal Kanjivaram Silk"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3500"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Buy Price (₹){" "}
                <span className="text-[10px] text-slate-400">(Admin only)</span>
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="2000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600 bg-white"
              >
                <option value="Banarasi">Banarasi</option>
                <option value="Kanjivaram">Kanjivaram</option>
                <option value="Chanderi">Chanderi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Store Visibility Status
            </label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                isActive
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-300 text-slate-600"
              }`}
            >
              {isActive ? (
                <>
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Active (Visible on Frontend Store)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-slate-500" />
                  <span>Inactive (Hidden from Frontend)</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Upload Image File (Max 5MB)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-rose-500 transition">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-500 text-center truncate max-w-[200px]">
                {imageFile ? imageFile.name : "Click to browse image"}
              </span>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-16 h-20 object-cover rounded-lg border"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Badge Tag
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Best Seller / New Arrival"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : editingId ? (
              <>
                <span>Update Product Details</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Save & Publish Saree</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Existing Inventory List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px] lg:h-full lg:min-h-[650px] mb-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
          <h3 className="font-bold text-lg text-slate-900">
            Inventory Manager ({filteredProducts.length} Items)
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-rose-600 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-3 min-h-0">
          {filteredProducts.map((product) => {
            const productIsActive = product.is_active ?? true;
            return (
              <div
                key={product.id}
                className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition ${
                  productIsActive
                    ? "border-slate-100 bg-slate-50/50"
                    : "border-amber-200 bg-amber-50/30"
                }`}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-14 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-rose-600 uppercase">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md">
                      Stock: {product.stock ?? 0}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        productIsActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {productIsActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs font-bold text-slate-900">
                      Sell: ₹{product.price.toLocaleString()}
                    </p>
                    {product.buy_price && (
                      <p className="text-xs font-semibold text-slate-500">
                        Buy: ₹{Number(product.buy_price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(product)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWithStorageCleanup(product)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Item & Storage Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">
              No products matched your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
