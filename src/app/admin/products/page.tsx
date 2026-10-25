"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Star,
  Sparkles,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Package,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { Product, ProductCategory } from "@/types/store";

const CATEGORIES: ProductCategory[] = [
  "Oversized",
  "Boxy Fit",
  "Jackets",
];

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, loading, error, notice, clearError } = useAdminData({ products: true });

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [stockFilter, setStockFilter] = useState<"All" | "InStock" | "LowStock" | "OutOfStock">("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick inline stock increment/decrement
  const handleStockAdjust = (p: Product, delta: number) => {
    const nextCount = Math.max(0, p.stockCount + delta);
    updateProduct({
      ...p,
      stockCount: nextCount,
      inStock: nextCount > 0,
    });
  };

  // New product form state
  const [newForm, setNewForm] = useState({
    name: "",
    subtitle: "",
    price: 2499,
    originalPrice: 2999,
    category: "Oversized" as ProductCategory,
    description: "",
    details: "520gsm 100% Organic Loopback Cotton\nSeamless dropped shoulders\nDouble-needle reinforced seams",
    fabric: "520gsm Japanese Loopback Terry",
    careInstructions: "Machine wash cold inside out\nAir dry flat",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    sizes: "S, M, L, XL",
    colorName: "Deep Burgundy",
    colorHex: "#4A1216",
    featured: true,
    inStock: true,
    stockCount: 15,
  });

  const lowStockCount = products.filter((p) => p.stockCount > 0 && p.stockCount <= 5).length;
  const outOfStockCount = products.filter((p) => p.stockCount === 0 || !p.inStock).length;

  const filteredProducts = products.filter((p) => {
    if (selectedCat !== "All" && p.category !== selectedCat) return false;
    if (stockFilter === "InStock" && (!p.inStock || p.stockCount === 0)) return false;
    if (stockFilter === "LowStock" && (p.stockCount <= 0 || p.stockCount > 5)) return false;
    if (stockFilter === "OutOfStock" && p.inStock && p.stockCount > 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addProduct({
      name: newForm.name,
      subtitle: newForm.subtitle,
      price: Number(newForm.price),
      originalPrice: newForm.originalPrice ? Number(newForm.originalPrice) : undefined,
      category: newForm.category,
      description: newForm.description,
      details: newForm.details.split("\n").filter(Boolean),
      fabric: newForm.fabric,
      careInstructions: newForm.careInstructions.split("\n").filter(Boolean),
      images: [newForm.imageUrl],
      sizes: newForm.sizes.split(",").map((s) => s.trim()),
      colors: [{ name: newForm.colorName, hex: newForm.colorHex }],
      featured: newForm.featured,
      inStock: newForm.inStock,
      stockCount: Number(newForm.stockCount),
      tags: [newForm.category.toLowerCase(), "atelier"],
    });
    if (!created) return;

    setIsAddModalOpen(false);
    setNewForm({
      name: "",
      subtitle: "",
      price: 2499,
      originalPrice: 2999,
      category: "Oversized",
      description: "",
      details: "520gsm 100% Organic Loopback Cotton\nSeamless dropped shoulders",
      fabric: "520gsm Japanese Loopback Terry",
      careInstructions: "Machine wash cold inside out\nAir dry flat",
      imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
      sizes: "S, M, L, XL",
      colorName: "Deep Burgundy",
      colorHex: "#4A1216",
      featured: true,
      inStock: true,
      stockCount: 15,
    });
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the atelier catalog?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={clearError} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Catalog Inventory & CRUD Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
            Menswear Products ({products.length})
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            Manage garment listings, adjust stock counts with 1-click inline controls, and toggle featured homepage status.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2.5 px-4 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Garment</span>
        </button>
      </div>

      {/* Inventory Health Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStockFilter("All")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stockFilter === "All"
              ? "bg-espresso text-ivory border-espresso shadow-xs"
              : "bg-white text-espresso border-burgundy/15 hover:border-burgundy/40"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Total Catalog</span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{products.length}</span>
        </button>

        <button
          onClick={() => setStockFilter("InStock")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stockFilter === "InStock"
              ? "bg-green-800 text-white border-green-800 shadow-xs"
              : "bg-white text-green-900 border-green-200 hover:border-green-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">In Stock</span>
          <span className="text-2xl font-serif font-bold block mt-0.5">
            {products.filter((p) => p.inStock && p.stockCount > 0).length}
          </span>
        </button>

        <button
          onClick={() => setStockFilter("LowStock")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stockFilter === "LowStock"
              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
              : "bg-white text-amber-900 border-amber-200 hover:border-amber-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Low Stock (≤ 5)
          </span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{lowStockCount}</span>
        </button>

        <button
          onClick={() => setStockFilter("OutOfStock")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            stockFilter === "OutOfStock"
              ? "bg-red-700 text-white border-red-700 shadow-xs"
              : "bg-white text-red-900 border-red-200 hover:border-red-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Out of Stock</span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{outOfStockCount}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-burgundy/15 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-espresso/40" />
          <input
            type="text"
            placeholder="Search by garment, weave, fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ivory pl-10 pr-3 py-2 text-xs rounded-xl border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
          />
        </div>

        {/* Silhouette Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCat("All")}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === "All"
                ? "bg-burgundy text-gold font-bold"
                : "bg-ivory text-espresso hover:bg-ivory-dark"
            }`}
          >
            All Silhouettes ({products.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? "bg-burgundy text-gold font-bold"
                    : "bg-ivory text-espresso hover:bg-ivory-dark"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table with Inline Stock Adjustments */}
      <div className="bg-white rounded-2xl border border-burgundy/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-ivory text-espresso/80 border-b border-burgundy/15 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3.5">Garment</th>
                <th className="p-3.5">Silhouette</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Inventory & Restock</th>
                <th className="p-3.5">Storefront Status</th>
                <th className="p-3.5">Drop List</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/10">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-espresso/60">
                    No garments matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-12 h-14 object-cover rounded bg-ivory-dark border border-burgundy/10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/product/${p.id}`}
                            target="_blank"
                            className="font-serif font-bold text-espresso hover:text-burgundy flex items-center gap-1 line-clamp-1"
                          >
                            <span>{p.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-40 flex-shrink-0" />
                          </Link>
                          <span className="text-[11px] text-espresso/60 block truncate">{p.subtitle}</span>
                          <span className="text-[10px] text-stone-400 font-mono block">{p.fabric}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-espresso/80 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-ivory-dark font-mono text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-burgundy whitespace-nowrap">
                      ₹{p.price.toLocaleString("en-IN")}
                      {p.originalPrice && (
                        <span className="text-[10px] text-stone-400 line-through block">
                          ₹{p.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            p.stockCount === 0
                              ? "bg-red-100 text-red-800"
                              : p.stockCount <= 5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-800"
                          }`}
                        >
                          {p.stockCount} units
                        </span>

                        {/* Inline Quick Restock Controls */}
                        <div className="inline-flex items-center rounded-lg border border-burgundy/15 bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p, -1)}
                            disabled={p.stockCount === 0}
                            className="px-2 py-0.5 text-xs text-espresso hover:bg-ivory disabled:opacity-30 rounded-l transition-colors"
                            title="Decrement stock by 1"
                          >
                            -1
                          </button>
                          <span className="w-px h-3 bg-burgundy/15" />
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p, 1)}
                            className="px-2 py-0.5 text-xs text-espresso hover:bg-ivory rounded-r transition-colors"
                            title="Increment stock by 1"
                          >
                            +1
                          </button>
                          <span className="w-px h-3 bg-burgundy/15" />
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p, 10)}
                            className="px-2 py-0.5 text-[10px] font-bold text-burgundy hover:bg-ivory rounded-r transition-colors"
                            title="Quick restock: +10 units"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => updateProduct({ ...p, inStock: !p.inStock })}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          p.inStock && p.stockCount > 0
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                        title="Click to toggle in stock state"
                      >
                        {p.inStock && p.stockCount > 0 ? "In Stock" : "Out of Stock"}
                      </button>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => updateProduct({ ...p, featured: !p.featured })}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          p.featured
                            ? "border-gold bg-gold/10 text-gold hover:bg-gold/20"
                            : "border-stone-200 bg-white text-stone-300 hover:text-stone-500"
                        }`}
                        title="Toggle Featured on Drop List"
                      >
                        <Star className={`w-4 h-4 ${p.featured ? "fill-gold text-gold" : ""}`} />
                      </button>
                    </td>
                    <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 text-burgundy hover:bg-burgundy/10 rounded-lg transition-colors"
                        title="Edit Product Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-crimson hover:bg-crimson/10 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ivory rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-burgundy/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-burgundy/20">
              <h3 className="font-serif text-xl font-bold text-espresso">
                Add New Garment to Trend Street Atelier
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-espresso/60 hover:text-burgundy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Garment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Mayfair Heavyweight Tee"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Subtitle / Weave</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 320gsm Combed Jersey"
                    value={newForm.subtitle}
                    onChange={(e) => setNewForm({ ...newForm, subtitle: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Category</label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value as ProductCategory })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={newForm.price}
                    onChange={(e) => setNewForm({ ...newForm, price: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Original Price (₹ INR) (Optional)</label>
                  <input
                    type="number"
                    value={newForm.originalPrice}
                    onChange={(e) => setNewForm({ ...newForm, originalPrice: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Fabric & Mill Details</label>
                  <input
                    type="text"
                    required
                    value={newForm.fabric}
                    onChange={(e) => setNewForm({ ...newForm, fabric: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Product Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detailed sartorial narrative of silhouette and handcraft..."
                    value={newForm.description}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Primary Image URL</label>
                  <input
                    type="url"
                    required
                    value={newForm.imageUrl}
                    onChange={(e) => setNewForm({ ...newForm, imageUrl: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Available Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={newForm.sizes}
                    onChange={(e) => setNewForm({ ...newForm, sizes: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    value={newForm.stockCount}
                    onChange={(e) => setNewForm({ ...newForm, stockCount: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-5 bg-white border border-burgundy/20 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-burgundy hover:bg-crimson text-gold font-bold uppercase tracking-wider rounded-xl shadow-md"
                >
                  Save & Publish to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ivory rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-burgundy/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-burgundy/20">
              <h3 className="font-serif text-xl font-bold text-espresso">
                Edit Garment: {editingProduct.name}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-espresso/60 hover:text-burgundy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Garment Name</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editingProduct.subtitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={editingProduct.stockCount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Fabric & Mill</label>
                  <input
                    type="text"
                    value={editingProduct.fabric}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-espresso mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="py-2.5 px-5 bg-white border border-burgundy/20 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-burgundy hover:bg-crimson text-gold font-bold uppercase tracking-wider rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
