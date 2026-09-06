import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { BarChart3, TrendingUp, Package, Calendar, Filter } from "lucide-react";

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState([]);
  const [allProductsList, setAllProductsList] = useState([]);

  // Filter States
  const [topLimit, setTopLimit] = useState(20);
  const [timeRange, setTimeRange] = useState("all");

  // Overview Cards State
  const [metrics, setMetrics] = useState({
    weeklyRevenue: 0,
    weeklyOrders: 0,
    monthlyRevenue: 0,
    monthlyOrders: 0,
    yearlyRevenue: 0,
    yearlyOrders: 0,
  });

  // Table Data State
  const [filteredTopProducts, setFilteredTopProducts] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    calculateBestSellers(ordersData, allProductsList, timeRange, topLimit);
  }, [ordersData, allProductsList, timeRange, topLimit]);

  // Helper: Get Current Date/Time normalized to IST
  const getISTNow = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + istOffset);
  };

  // Helper: Convert Timestamp to IST Date Object
  const parseToIST = (dateString) => {
    if (!dateString) return new Date();
    const d = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + istOffset);
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersErr) throw ordersErr;

      // 2. Fetch Catalog Products (Fallback baseline so list is never empty)
      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("*");

      if (prodErr)
        console.warn("Could not fetch catalog products:", prodErr.message);

      const allOrders = orders || [];
      const catalog = products || [];

      setOrdersData(allOrders);
      setAllProductsList(catalog);

      // Metric Calculations
      const istNow = getISTNow();
      const oneWeekAgo = new Date(istNow.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
      const startOfYear = new Date(istNow.getFullYear(), 0, 1);

      let wRev = 0,
        wCount = 0;
      let mRev = 0,
        mCount = 0;
      let yRev = 0,
        yCount = 0;

      allOrders.forEach((order) => {
        const orderDateIST = parseToIST(order.created_at || order.createdAt);
        const orderTotal = Number(order.total) || 0;

        if (orderDateIST >= oneWeekAgo) {
          wRev += orderTotal;
          wCount++;
        }
        if (orderDateIST >= startOfMonth) {
          mRev += orderTotal;
          mCount++;
        }
        if (orderDateIST >= startOfYear) {
          yRev += orderTotal;
          yCount++;
        }
      });

      setMetrics({
        weeklyRevenue: wRev,
        weeklyOrders: wCount,
        monthlyRevenue: mRev,
        monthlyOrders: mCount,
        yearlyRevenue: yRev,
        yearlyOrders: yCount,
      });
    } catch (err) {
      console.error("Failed to generate report:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateBestSellers = (orders, catalog, range, limit) => {
    const istNow = getISTNow();
    let cutoffDate = null;

    if (range === "weekly") {
      cutoffDate = new Date(istNow.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "monthly") {
      cutoffDate = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
    } else if (range === "yearly") {
      cutoffDate = new Date(istNow.getFullYear(), 0, 1);
    } else if (range === "last1") {
      cutoffDate = new Date(
        istNow.getFullYear() - 1,
        istNow.getMonth(),
        istNow.getDate(),
      );
    } else if (range === "last2") {
      cutoffDate = new Date(
        istNow.getFullYear() - 2,
        istNow.getMonth(),
        istNow.getDate(),
      );
    } else if (range === "last3") {
      cutoffDate = new Date(
        istNow.getFullYear() - 3,
        istNow.getMonth(),
        istNow.getDate(),
      );
    }

    const productSalesMap = {};

    // Step A: Seed map with catalog items (0 sales default)
    catalog.forEach((prod) => {
      const key = prod.id || prod.name || prod.title;
      productSalesMap[key] = {
        id: key,
        name: prod.name || prod.title || "Product " + key,
        category: prod.category || "General",
        image: prod.image || prod.imageUrl || prod.image_url || "",
        price: Number(prod.price) || 0,
        totalQtySold: 0,
        totalRevenue: 0,
      };
    });

    // Step B: Aggregate order items matching cutoff filter
    orders.forEach((order) => {
      const orderDateIST = parseToIST(order.created_at || order.createdAt);

      if (cutoffDate && orderDateIST < cutoffDate) return;

      let itemsList = order.items;
      if (typeof itemsList === "string") {
        try {
          itemsList = JSON.parse(itemsList);
        } catch (e) {
          itemsList = [];
        }
      }

      if (Array.isArray(itemsList)) {
        itemsList.forEach((item) => {
          const key = item.id || item.name || item.title;
          if (!key) return;

          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              id: key,
              name: item.name || item.title || "Product " + key,
              category: item.category || "General",
              image: item.image || item.imageUrl || "",
              price: Number(item.price) || 0,
              totalQtySold: 0,
              totalRevenue: 0,
            };
          }

          const qty = Number(item.quantity || item.qty) || 1;
          const price = Number(item.price) || 0;

          productSalesMap[key].totalQtySold += qty;
          productSalesMap[key].totalRevenue += price * qty;
        });
      }
    });

    // Step C: Sort by sales first, fall back to product name
    const sortedBestSellers = Object.values(productSalesMap)
      .sort((a, b) => {
        if (b.totalQtySold !== a.totalQtySold) {
          return b.totalQtySold - a.totalQtySold;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, Number(limit));

    setFilteredTopProducts([...sortedBestSellers]);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Generating IST analytics reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-rose-600" />
          Sales & Analytics Summary (IST)
        </h2>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Weekly (Last 7 Days)
            </span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{metrics.weeklyRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-xs font-medium text-slate-500">
            {metrics.weeklyOrders} orders placed
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              This Month
            </span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{metrics.monthlyRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-xs font-medium text-slate-500">
            {metrics.monthlyOrders} orders placed
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              This Year
            </span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{metrics.yearlyRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-xs font-medium text-slate-500">
            {metrics.yearlyOrders} orders placed
          </p>
        </div>
      </div>

      {/* Best Sellers Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Best Selling Products ({filteredTopProducts.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value))}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-rose-600 cursor-pointer"
            >
              <option value={10}>Top 10 Products</option>
              <option value={20}>Top 20 Products</option>
              <option value={50}>Top 50 Products</option>
              <option value={100}>Top 100 Products</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-rose-600 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="weekly">Weekly (Last 7 Days)</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="last1">Last 1 Year</option>
              <option value="last2">Last 2 Years</option>
              <option value="last3">Last 3 Years</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-center">Units Sold</th>
                <th className="p-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTopProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">
                    No products found in database.
                  </td>
                </tr>
              ) : (
                filteredTopProducts.map((prod, index) => (
                  <tr
                    key={`${timeRange}-${prod.id}-${index}`}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="p-3 font-bold text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                      {prod.image && (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-8 h-8 rounded object-cover border border-slate-200"
                        />
                      )}
                      <span>{prod.name}</span>
                    </td>
                    <td className="p-3 text-slate-500">{prod.category}</td>
                    <td className="p-3 font-semibold">
                      ₹{Number(prod.price).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          prod.totalQtySold > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {prod.totalQtySold}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      ₹{prod.totalRevenue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
