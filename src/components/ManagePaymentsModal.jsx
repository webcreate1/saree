import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, X } from "lucide-react";

export function ManagePaymentsModal({ order, onClose, onPaymentUpdated }) {
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("order_payments")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });

    if (data) setPayments(data);
  };

  useEffect(() => {
    fetchPayments();
  }, [order.id]);

  const totalPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || 0),
    0,
  );
  const remainingBalance = Math.max(
    0,
    parseFloat(order.total || 0) - totalPaid,
  );

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    // Validation Check: Payment cannot exceed remaining due balance
    if (parsedAmount > remainingBalance) {
      setErrorMsg(
        `Payment amount cannot exceed remaining balance (₹${remainingBalance.toLocaleString()}).`,
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("order_payments").insert([
      {
        order_id: order.id,
        amount: parsedAmount,
        payment_method: method,
        notes: notes,
      },
    ]);

    if (!error) {
      setAmount("");
      setNotes("");
      await fetchPayments();
      onPaymentUpdated();
    } else {
      setErrorMsg("Failed to record payment. Please try again.");
    }
    setLoading(false);
  };

  const handleDeletePayment = async (paymentId, paymentAmount) => {
    // Delete Alert Confirmation
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this payment of ₹${paymentAmount}?`,
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("order_payments")
      .delete()
      .eq("id", paymentId);

    if (!error) {
      await fetchPayments();
      onPaymentUpdated();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Manage Payments — Order #{order.id}
            </h3>
            <p className="text-xs text-slate-500">
              Total: ₹{parseFloat(order.total || 0).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Total Paid
            </span>
            <p className="text-sm font-bold text-emerald-600">
              ₹{totalPaid.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Balance Due
            </span>
            <p
              className={`text-sm font-bold ${
                remainingBalance <= 0 ? "text-slate-600" : "text-rose-600"
              }`}
            >
              ₹{remainingBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleAddPayment} className="space-y-3">
          {errorMsg && (
            <div className="p-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-rose-500"
              required
            />
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-rose-500"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-rose-500"
            />
            <button
              type="submit"
              disabled={loading || remainingBalance <= 0}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-700">
            Payment Breakdown
          </h4>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No payments recorded yet.
            </p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    ₹{p.amount} ({p.payment_method})
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(p.created_at).toLocaleString()}{" "}
                    {p.notes && `• ${p.notes}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePayment(p.id, p.amount)}
                  className="text-slate-400 hover:text-rose-600 transition"
                  title="Delete Payment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
