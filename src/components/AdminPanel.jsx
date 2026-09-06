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
import { OrdersTracker } from "./OrdersTracker";
import { ProductsManager } from "./ProductsManager";
import { AdminReports } from "./AdminReports";
export function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBackToStore,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("products"); // "products", "orders", or "reports"

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
        <AdminReports />
      )}
    </div>
  );
}
