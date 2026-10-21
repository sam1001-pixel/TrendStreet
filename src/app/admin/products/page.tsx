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
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { Product, ProductCategory } from "@/types/store";

const CATEGORIES: ProductCategory[] = [
  "Oversized",
  "Jeans",
  "Boxy Fit",
  "Jackets",
];

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, loading, error, notice, clearError } = useAdminData({ products: true });

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const filteredProducts = products.filter((p) => {
    if (selectedCat !== "All" && p.category !== selectedCat) return false;
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
    if (!created) return; // keep the form open so nothing typed is lost

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
    <div className="space-y-8 animate-in fade-in duration-300">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={clearError} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Catalog Inventory & CRUD
          </span>
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Menswear Products ({products.length})
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            Add new garments, modify pricing, toggle stock readiness, or edit details in real time.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-3 px-6 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Garment</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-burgundy/15 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-espresso/40" />
          <input
            type="text"
            placeholder="Search garment title or fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ivory pl-10 pr-3 py-2 text-xs rounded-xl border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedCat("All")}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === "All"
                ? "bg-burgundy text-gold font-bold"
                : "bg-ivory text-espresso hover:bg-ivory-dark"
            }`}
          >
            All ({products.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === cat
                  ? "bg-burgundy text-gold font-bold"
                  : "bg-ivory text-espresso hover:bg-ivory-dark"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-burgundy/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-ivory text-espresso/80 border-b border-burgundy/15 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3.5">Garment</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Featured</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/10">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-12 h-14 object-cover rounded bg-ivory-dark"
                      />
                      <div>
                        <Link
                          href={`/product/${p.id}`}
                          target="_blank"
                          className="font-serif font-bold text-espresso hover:text-burgundy flex items-center gap-1"
                        >
                          <span>{p.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-40" />
                        </Link>
                        <span className="text-[11px] text-espresso/60 block">{p.subtitle}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-espresso/80">{p.category}</td>
                  <td className="p-3.5 font-bold text-burgundy">₹{p.price.toLocaleString("en-IN")}</td>
                  <td className="p-3.5">
                    <span className="font-mono text-espresso font-semibold">
                      {p.stockCount} units
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() =>
                        updateProduct({ ...p, inStock: !p.inStock })
                      }
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        p.inStock
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                      title="Click to toggle in stock state"
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </button>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() =>
                        updateProduct({ ...p, featured: !p.featured })
                      }
                      className={`p-1 rounded text-xs transition-colors ${
                        p.featured ? "text-gold" : "text-gray-300"
                      }`}
                      title="Toggle Featured"
                    >
                      <Star className={`w-4 h-4 ${p.featured ? "fill-gold" : ""}`} />
                    </button>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="p-1.5 text-burgundy hover:bg-burgundy/10 rounded"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-crimson hover:bg-crimson/10 rounded"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ivory rounded-3xl max-w-2xl w-full p-8 border border-burgundy/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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
                    placeholder="e.g. The Dorchester Velvet Smoking Jacket"
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
                    placeholder="e.g. Italian Silk-Velvet with Satin Lapels"
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
                  <label className="block font-semibold text-espresso mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={newForm.price}
                    onChange={(e) => setNewForm({ ...newForm, price: Number(e.target.value) })}
                    className="w-full bg-white px-3 py-2 rounded-xl border border-burgundy/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Original Price ($ USD) (Optional)</label>
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
          <div className="bg-ivory rounded-3xl max-w-2xl w-full p-8 border border-burgundy/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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
                  <label className="block font-semibold text-espresso mb-1">Price ($ USD)</label>
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
