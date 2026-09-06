import React from "react";
import { Plus } from "lucide-react";

export function ProductCard({ product, index, onAddToCart }) {
  return (
    <div
      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          {product.tag}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
            {product.category}
          </p>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 mt-0.5">
            {product.name}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">
            ₹{product.price.toLocaleString()}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white transition-colors shadow-sm flex items-center justify-center"
            title="Add to Cart"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
