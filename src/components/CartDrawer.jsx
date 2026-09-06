import React, { useState } from "react";
import {
  X,
  Trash2,
  ShoppingBag,
  MessageCircle,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemove,
  total,
  phoneNumber,
  onUpdateQuantity,
  onCheckStock,
  onDecreaseStock,
  onClearCart, // <-- 1. ADD THIS PROP
}) {
  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem("saree_customer_name") || "",
  );
  const [customerPhone, setCustomerPhone] = useState(
    () => localStorage.getItem("saree_customer_phone") || "",
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => localStorage.getItem("saree_customer_address") || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleWhatsAppCheckout = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      return alert("Please enter your full name.");
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(customerPhone)) {
      return alert("Please enter a valid 10-digit mobile number.");
    }

    if (!deliveryAddress.trim()) {
      return alert("Please enter your delivery address.");
    }

    setIsSubmitting(true);

    try {
      // 1. Save user details to localStorage for future orders
      localStorage.setItem("saree_customer_name", customerName);
      localStorage.setItem("saree_customer_phone", customerPhone);
      localStorage.setItem("saree_customer_address", deliveryAddress);

      // 2. Check stock availability in database first
      if (onCheckStock) {
        const stockCheck = await onCheckStock(cart);
        if (!stockCheck.success) {
          alert(stockCheck.message);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Save Order History to Supabase 'orders' table AND retrieve inserted ID
      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerName,
            phone: customerPhone,
            delivery_address: deliveryAddress,
            items: cart,
            total: total,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Automatically Decrease Stock Quantities in Database
      if (onDecreaseStock) {
        await onDecreaseStock(cart);
      }

      // 5. Construct WhatsApp Message including Order ID
      const orderId = createdOrder.id;

      let message = `*New Saree Order*\n`;
      message += `*Order ID:* #${orderId}\n\n`;
      message += `*Name:* ${customerName}\n`;
      message += `*Phone:* ${customerPhone}\n`;
      message += `*Delivery Address:* ${deliveryAddress}\n\n`;
      message += `*Items Ordered:*\n`;
      cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.category}) - Qty: ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString()}\n`;
      });
      message += `\n*Total Amount:* ₹${total.toLocaleString()}`;

      // Clean store phone number
      let cleanPhone = phoneNumber
        ? phoneNumber.replace(/[^0-9]/g, "").replace(/^0+/, "")
        : "";
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      // 6. Open WhatsApp
      window.open(whatsappUrl, "_blank");

      // 7. Clear cart state & reset drawer
      if (onClearCart) {
        onClearCart(); // <-- 2. CLEAR CART STATE HERE
      }

      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Checkout error:", error.message);
      alert("Failed to process order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900">Your Shopping Bag</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              Your bag is empty. Add sarees to proceed.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-900">
                    ₹{item.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-6 h-6 bg-white border rounded text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-6 h-6 bg-white border rounded text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Form */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Total Amount:</span>
              <span className="font-bold text-slate-900 text-base">
                ₹{total.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleWhatsAppCheckout} className="space-y-3">
              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-rose-600"
                    required
                  />
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  WhatsApp Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full pl-12 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-rose-600"
                    required
                  />
                  <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House no, Street, City, Pincode"
                    rows={2}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-rose-600 resize-none"
                    required
                  />
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? "Processing Order..."
                    : "Place Order via WhatsApp"}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
