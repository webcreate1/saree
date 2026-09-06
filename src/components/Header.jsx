import React from "react";
import { Phone, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";

export function Header({ cartCount, onOpenCart, phoneNumber }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="bg-rose-600 text-white p-2 rounded-xl sm:rounded-2xl shadow-md shadow-rose-600/20 shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-rose-700 to-pink-600 bg-clip-text text-transparent truncate">
              Royal Banaras
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
              Handloom Sarees
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Call Button */}
          <a
            href={`tel:${phoneNumber}`}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Call Us"
          >
            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="hidden lg:inline">Call</span>
          </a>

          {/* Enhanced WhatsApp Button */}
          <a
            href={`https://wa.me/${phoneNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-[#25D366] hover:bg-[#22bf5b] text-white shadow-sm shadow-[#25D366]/20 transition"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span className="hidden xs:inline sm:inline">WhatsApp</span>
          </a>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-600 text-white shadow-sm transition"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
