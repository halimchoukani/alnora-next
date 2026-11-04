"use client";

import Link from "next/link";
import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { categories, formatPrice, productImage, type Product } from "@/lib/products";
import { Order, OrderStatus } from "@/lib/types";

const field =
  "w-full border bg-background px-3 py-2 text-base sm:text-sm outline-none focus:border-primary min-h-[44px]";
const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminPage() {
  const { isAdmin, ready } = useAuth();
  const [tab, setTab] = useState<"products" | "orders">("products");

  if (!ready) {
    return <p className="py-24 sm:py-32 text-center text-muted-foreground">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="py-24 sm:py-32 text-center px-4 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl">Admins only</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          You must be signed in with an administrative account to access the store management panel.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/auth" className="btn-luxe">
            Sign in as Admin
          </Link>
          <Link href="/" className="btn-outline-luxe">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-3xl sm:text-5xl text-center">Store Admin</h1>

      <div className="mt-6 sm:mt-8 flex justify-center gap-6 sm:gap-8 border-b pb-4">
        {(["products", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`eyebrow py-1.5 px-3 transition-colors capitalize cursor-pointer ${
              tab === t
                ? "link-underline text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "products" ? <AdminProducts /> : <AdminOrders />}
    </div>
  );
}

/* ─── Products Tab ─── */

function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadProducts = () => {
    fetch("/api/products?all=true")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Error loading products:", err));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try {
      const res = await fetch(
        `/api/products/${p.id}?userId=${encodeURIComponent(user?.id || "")}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete product");
      }
      toast.success("Deleted");
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleInitAppwrite = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Setup failed");
      }
      toast.success(data.message || "Appwrite initialized successfully!");
      loadProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mt-8 sm:mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground text-xs">{products.length} pieces in catalog</p>
          <p className="text-xs text-muted-foreground mt-0.5">Connected to Appwrite backend database</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={syncing}
            onClick={handleInitAppwrite}
            className="btn-outline-luxe text-xs py-2 px-3"
            title="Create Appwrite collections and seed catalog"
          >
            {syncing ? "Syncing Appwrite…" : "Sync Appwrite Schema"}
          </button>
          <button className="btn-luxe w-full sm:w-auto" onClick={() => setEditing("new")}>
            Add product
          </button>
        </div>
      </div>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          userId={user?.id || ""}
          onDone={() => {
            setEditing(null);
            loadProducts();
          }}
        />
      )}

      <div className="mt-6 divide-y border-y">
        {products.map((p) => (
          <div key={p.id} className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <img
                src={productImage(p)}
                alt=""
                className="h-16 w-16 flex-shrink-0 object-cover bg-card shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg sm:text-xl truncate">
                  {p.name}{" "}
                  {!p.is_active && (
                    <span className="eyebrow text-[10px] text-muted-foreground ml-2 border px-1.5 py-0.5">
                      hidden
                    </span>
                  )}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  <span className="capitalize">{p.category}</span> &middot; {formatPrice(p.price)} &middot;{" "}
                  {p.stock} in stock
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 self-end sm:self-center">
              <button
                className="eyebrow text-xs link-underline p-1.5 hover:text-primary transition-colors cursor-pointer"
                onClick={() => setEditing(p)}
              >
                Edit
              </button>
              <button
                className="eyebrow text-xs text-destructive p-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => remove(p)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Product Form with Image Upload ─── */

function ProductForm({
  product,
  userId,
  onDone,
}: {
  product: Product | null;
  userId: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    product ? productImage(product) : ""
  );
  const [imageUrl, setImageUrl] = useState<string>(product?.image_url || "");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10 MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("userId", userId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Image upload failed");
      }
      const data = await res.json();
      return data.fileUrl as string;
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);

    try {
      // 1. Upload image if a new file was selected
      let finalImageUrl = imageUrl;
      if (selectedFile) {
        const uploaded = await uploadImage();
        if (!uploaded) {
          setBusy(false);
          return; // upload failed, don't save product
        }
        finalImageUrl = uploaded;
      }

      // 2. Build product payload
      const f = new FormData(e.currentTarget);
      const name = String(f.get("name")).trim();
      const row = {
        userId, // include userId for admin verification
        name,
        slug: product?.slug ?? slugify(name),
        collection: String(f.get("collection")).trim(),
        category: String(f.get("category")),
        price: Number(f.get("price")),
        stock: Number(f.get("stock")),
        image_url: finalImageUrl,
        material: String(f.get("material")).trim(),
        description: String(f.get("description")).trim(),
        is_active: f.get("is_active") === "on",
      };

      // 3. Save product
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      toast.success(product ? "Product updated" : "Product added");
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 border p-4 sm:p-6 sm:grid-cols-2 bg-card">
      <h2 className="sm:col-span-2 text-xl sm:text-2xl font-display">
        {product ? `Edit ${product.name}` : "New product"}
      </h2>

      {/* Image Upload Area */}
      <div className="sm:col-span-2">
        <span className="eyebrow text-xs">Product Image</span>
        <div
          className={`mt-1 border-2 border-dashed rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {/* Preview */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-28 w-28 object-cover bg-background shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="h-28 w-28 bg-muted flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          <div className="text-center sm:text-left flex-1 min-w-0">
            <p className="text-sm font-medium">
              {selectedFile ? selectedFile.name : "Click or drag image to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(0)} KB — will upload on save`
                : "JPG, PNG, or WebP up to 10 MB"}
            </p>
            {selectedFile && (
              <button
                type="button"
                className="text-xs text-destructive mt-2 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setPreviewUrl(product ? productImage(product) : "");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Remove selection
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* Manual URL fallback */}
        {!selectedFile && (
          <div className="mt-2">
            <input
              name="image_url_manual"
              placeholder="Or paste image URL: /assets/ring.jpg or https://…"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewUrl(e.target.value || (product ? productImage(product) : ""));
              }}
              className={`${field} text-xs`}
            />
          </div>
        )}
      </div>

      <label>
        <span className="eyebrow text-xs">Name</span>
        <input name="name" required defaultValue={product?.name} className={`${field} mt-1`} />
      </label>
      <label>
        <span className="eyebrow text-xs">Collection</span>
        <input name="collection" defaultValue={product?.collection} className={`${field} mt-1`} />
      </label>
      <label>
        <span className="eyebrow text-xs">Category</span>
        <select
          name="category"
          defaultValue={product?.category ?? "rings"}
          className={`${field} mt-1`}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="eyebrow text-xs">Price (USD)</span>
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={product?.price}
          className={`${field} mt-1`}
        />
      </label>
      <label>
        <span className="eyebrow text-xs">Stock</span>
        <input
          name="stock"
          type="number"
          min={0}
          required
          defaultValue={product?.stock ?? 10}
          className={`${field} mt-1`}
        />
      </label>
      <label>
        <span className="eyebrow text-xs">Material</span>
        <input name="material" defaultValue={product?.material} className={`${field} mt-1`} />
      </label>
      <label className="sm:col-span-2">
        <span className="eyebrow text-xs">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description}
          className={`${field} mt-1`}
        />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2 py-1 cursor-pointer">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={product?.is_active ?? true}
          className="h-4 w-4"
        />
        <span>Visible in shop</span>
      </label>
      <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
        <button disabled={busy || uploading} className="btn-luxe w-full sm:w-auto cursor-pointer">
          {uploading ? "Uploading image…" : busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onDone} className="btn-outline-luxe w-full sm:w-auto cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Orders Tab ─── */

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.error("Error loading orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Order updated");
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    }
  };

  if (loading) {
    return <p className="mt-10 text-center text-muted-foreground">Loading orders…</p>;
  }

  if (orders.length === 0) {
    return <p className="mt-10 text-center text-muted-foreground">No orders yet.</p>;
  }

  return (
    <div className="mt-8 sm:mt-10 divide-y border-y">
      {orders.map((o) => (
        <div key={o.id} className="py-6 flex flex-col md:grid md:grid-cols-3 gap-4">
          <div>
            <p className="eyebrow text-xs">#{o.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(o.created_at).toLocaleString()}
            </p>
            <p className="mt-2 font-medium text-base sm:text-lg">{formatPrice(Number(o.total))}</p>
          </div>
          <div className="text-sm">
            <p className="font-medium">
              {o.full_name || "—"} {o.phone && `· ${o.phone}`}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {[o.address_line, o.city, o.postal_code, o.country].filter(Boolean).join(", ") ||
                "No address given"}
            </p>
            <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
              {o.order_items?.map((i) => (
                <li key={i.id}>
                  {i.quantity} &times; {i.product_name}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:justify-self-end flex flex-col justify-center">
            <label className="text-xs eyebrow text-muted-foreground mb-1 md:hidden">Update Status</label>
            <select
              value={o.status}
              onChange={(e) => setStatus(o.id, e.target.value)}
              className={`${field} w-full md:w-auto uppercase text-xs cursor-pointer`}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
