import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  ListOrdered,
  CheckCircle2,
  Clock,
  Truck,
  RefreshCw,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ManagePaymentsModal } from "./ManagePaymentsModal";

const PAGE_SIZE = 10;

export function OrdersTracker() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  // Server-side fetch with pagination and database-level search
  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        order_payments (
          amount
        )
      `,
        { count: "exact" }, // Fetch total count for pagination calculations
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    // Apply database-level search filtering
    const q = search.trim();
    if (q) {
      if (!isNaN(q)) {
        query = query.or(
          `customer_name.ilike.%${q}%,phone.ilike.%${q}%,id.eq.${q}`,
        );
      } else {
        query = query.or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%`);
      }
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setOrders(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page to 1 when search query changes
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);

    const currentOrder = orders.find((order) => order.id === id);

    // 1. Update status in Supabase database
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
      );

      // 2. Open WhatsApp link to notify the customer directly
      if (
        (newStatus === "confirm" || newStatus === "delivered") &&
        currentOrder?.phone
      ) {
        let rawPhone = currentOrder.phone.replace(/[^0-9]/g, "");
        if (rawPhone.length === 10) rawPhone = `91${rawPhone}`;

        const customerName = currentOrder.customer_name || "Customer";
        let messageText = "";

        if (newStatus === "confirm") {
          messageText = `Hello ${customerName}, your saree order #${id} has been CONFIRMED! We are preparing your order for shipment.`;
        } else if (newStatus === "delivered") {
          messageText = `Hello ${customerName}, your saree order #${id} has been DELIVERED! Thank you for shopping with us!`;
        }

        const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(messageText)}`;
        window.open(whatsappUrl, "_blank");
      }
    }

    setUpdatingId(null);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">
            Customer Orders Tracker
          </h3>
          <p className="text-xs text-slate-500">
            Review customer orders, update statuses, and log installment
            payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, name, or phone..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
          <ListOrdered className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-slate-700">No Orders Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? "No orders match your search query."
              : "Orders placed by customers will automatically populate here."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items Purchased</th>
                  <th className="p-3">Fulfillment Status</th>
                  <th className="p-3">Payments</th>
                  <th className="p-3 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((order) => {
                  const total = parseFloat(order.total) || 0;
                  const totalPaid =
                    order.order_payments?.reduce(
                      (sum, p) => sum + parseFloat(p.amount || 0),
                      0,
                    ) || 0;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="p-3 align-top whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          #{order.id}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-semibold text-slate-900">
                          {order.customer_name || "Guest"}
                        </div>
                        <div className="text-slate-500">{order.phone}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[180px]">
                          {order.delivery_address}
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-xs">
                        <ul className="space-y-0.5">
                          {Array.isArray(order.items) &&
                            order.items.map((item, idx) => (
                              <li key={idx} className="text-slate-600 truncate">
                                • {item.title || item.name} x
                                {item.quantity || 1}
                              </li>
                            ))}
                        </ul>
                      </td>

                      <td className="p-3 align-top whitespace-nowrap">
                        <select
                          disabled={updatingId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border transition focus:outline-none ${
                            order.status === "delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : order.status === "confirm"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirm">Confirmed</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>

                      <td className="p-3 align-top whitespace-nowrap">
                        <div className="space-y-1">
                          <div>
                            Total:{" "}
                            <span className="font-bold text-slate-900">
                              ₹{total.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            Paid:{" "}
                            <span className="font-semibold text-emerald-600">
                              ₹{totalPaid.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedOrderForPayment(order)}
                            className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline pt-0.5"
                          >
                            <CreditCard className="w-3 h-3" /> Manage Payments
                          </button>
                        </div>
                      </td>

                      <td className="p-3 align-top text-right whitespace-nowrap">
                        {order.status === "delivered" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                        ) : order.status === "confirm" ? (
                          <Truck className="w-5 h-5 text-blue-500 ml-auto" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500 ml-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(page - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(page * PAGE_SIZE, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">{totalCount}</span>{" "}
              orders
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 px-2">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {selectedOrderForPayment && (
        <ManagePaymentsModal
          order={selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onPaymentUpdated={fetchOrders}
        />
      )}
    </div>
  );
}
