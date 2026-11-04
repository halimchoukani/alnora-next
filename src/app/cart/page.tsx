"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatPrice, productImage, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const { lines, setQty, remove, reload } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Error loading products:", err));
  }, []);

  const items = lines
    .map((l) => ({ ...l, p: products?.find((x) => x.id === l.productId || x.slug === l.productId) }))
    .filter((x): x is { productId: string; qty: number; p: Product } => Boolean(x.p));

  const total = items.reduce((s, x) => s + x.p.price * x.qty, 0);

  const checkout = async () => {
    if (!user) {
      router.push("/auth?redirect=/cart");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }
      await reload();
      setDoneId(data.orderId);
      toast.success("Order placed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <div className="py-16 sm:py-32 text-center px-4 sm:px-6 max-w-xl mx-auto">
        <h1 className="text-3xl sm:text-5xl">Thank you</h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Your order has been placed. Order reference {doneId.slice(0, 8).toUpperCase()}.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link href="/account" className="btn-luxe w-full sm:w-auto inline-block text-center">
            View my orders
          </Link>
          <Link href="/shop" className="btn-outline-luxe w-full sm:w-auto inline-block text-center">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!products && lines.length) {
    return <div className="py-24 sm:py-32 text-center text-muted-foreground px-4">Loading your bag…</div>;
  }

  if (!items.length) {
    return (
      <div className="py-20 sm:py-32 text-center px-4 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Discover pieces crafted in 18K gold and precious stones.
        </p>
        <Link href="/shop" className="btn-luxe mt-8 sm:mt-10 w-full sm:w-auto inline-block text-center">
          Discover jewelry
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-20">
      <h1 className="text-3xl sm:text-5xl text-center">Your Bag</h1>

      <div className="mt-8 sm:mt-14 divide-y border-y">
        {items.map(({ p, qty }) => (
          <div key={p.id} className="py-6 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
            <div className="flex gap-4 sm:contents">
              <img
                src={productImage(p)}
                alt={p.name}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-20 w-20 sm:h-28 sm:w-28 flex-shrink-0 object-cover bg-card shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <p className="eyebrow text-[10px] sm:text-xs text-muted-foreground">{p.collection}</p>
                <Link
                  href={`/product/${p.slug}`}
                  className="font-display text-lg sm:text-2xl hover:text-primary transition-colors block truncate"
                >
                  {p.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-0.5 sm:hidden">{formatPrice(p.price)} each</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:contents w-full">
              <div className="flex items-center gap-2 sm:gap-3 text-sm">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty(p.id, qty - 1)}
                  className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center border hover:bg-card transition-colors cursor-pointer"
                >
                  &minus;
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= p.stock}
                  onClick={() => setQty(p.id, qty + 1)}
                  className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center border hover:bg-card transition-colors disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="eyebrow text-[10px] sm:text-xs text-muted-foreground hover:text-destructive ml-4 sm:ml-6 p-1 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <p className="text-base sm:text-lg font-medium sm:font-normal whitespace-nowrap">
                {formatPrice(p.price * qty)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 sm:mt-10 flex flex-col items-stretch sm:items-end gap-4">
        <div className="flex justify-between sm:justify-end items-center gap-6 py-2 border-b sm:border-none">
          <span className="eyebrow text-muted-foreground">Subtotal</span>
          <span className="text-xl sm:text-2xl font-light">{formatPrice(total)}</span>
        </div>
        {user && (
          <p className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right leading-relaxed">
            Ships to the address in{" "}
            <Link href="/account" className="link-underline">
              your account
            </Link>
            . No payment is taken online.
          </p>
        )}
        <button
          className="btn-luxe w-full sm:w-auto"
          disabled={busy}
          onClick={checkout}
        >
          {user ? (busy ? "Placing order…" : "Place order") : "Sign in to check out"}
        </button>
      </div>
    </div>
  );
}

