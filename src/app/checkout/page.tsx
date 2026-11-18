"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { formatPrice, productImage, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const field =
  "w-full border bg-background px-4 py-3 text-base sm:text-sm outline-none focus:border-primary min-h-[44px]";

type ShippingInfo = {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
};

export default function CheckoutPage() {
  const { lines, reload } = useCart();
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [shipping, setShipping] = useState<ShippingInfo>({
    full_name: profile?.full_name || user?.name || "",
    phone: profile?.phone || "",
    address_line: profile?.address_line || "",
    city: profile?.city || "",
    postal_code: profile?.postal_code || "",
    country: profile?.country || "Algeria",
  });

  /* redirect if not signed in */
  useEffect(() => {
    if (!user) {
      router.replace("/auth?redirect=/checkout");
    }
  }, [user, router]);

  /* check if profile has complete address */
  const hasCompleteAddress = profile?.address_line && profile?.city && profile?.postal_code && profile?.country;

  /* load product catalog */
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Error loading products:", err));
  }, []);

  const items = lines
    .map((l) => ({
      ...l,
      p: products?.find((x) => x.id === l.productId || x.slug === l.productId),
    }))
    .filter((x): x is { productId: string; qty: number; p: Product } => Boolean(x.p));

  const subtotal = items.reduce((s, x) => s + x.p.price * x.qty, 0);
  const itemCount = items.reduce((s, x) => s + x.qty, 0);

  /* ── Handle address input ── */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── Step 1: Validate & continue ── */
  const continueToReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const missing = Object.entries(shipping).filter(([, v]) => !v.trim());
    if (missing.length) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep(2);
  };

  /* ── Step 2: Place Order ── */
  const placeOrder = async () => {
    if (!user) return;
    setBusy(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, shipping }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Save shipping address to profile for future orders
      const profileRes = await updateProfile(shipping);
      if (profileRes.error) {
        console.warn("Could not save address to profile:", profileRes.error);
      }

      await reload();
      setDoneId(data.orderId);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  /* ── Confirmation screen ── */
  if (doneId) {
    return (
      <div className="py-16 sm:py-32 text-center px-4 sm:px-6 max-w-xl mx-auto">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-5xl">Order Confirmed</h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Thank you for your order! Your reference is{" "}
          <span className="font-medium text-foreground">#{doneId.slice(0, 8).toUpperCase()}</span>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment will be collected upon delivery. We&apos;ll send you updates via email.
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

  /* ── Loading state ── */
  if (!user || (!products && lines.length)) {
    return <div className="py-24 sm:py-32 text-center text-muted-foreground px-4">Loading checkout…</div>;
  }

  /* ── Empty cart redirect ── */
  if (!items.length) {
    return (
      <div className="py-20 sm:py-32 text-center px-4 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-5xl">Nothing to check out</h1>
        <p className="mt-4 text-sm text-muted-foreground">Your bag is empty.</p>
        <Link href="/shop" className="btn-luxe mt-8 sm:mt-10 w-full sm:w-auto inline-block text-center">
          Discover jewelry
        </Link>
      </div>
    );
  }

  /* ── Require address in profile ── */
  if (!hasCompleteAddress && step === 1) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-5xl">Shipping Address Required</h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          You don&apos;t have a shipping address saved. Please add one to your profile before continuing.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link href="/account" className="btn-luxe w-full sm:w-auto inline-block text-center">
            Add Address in Account
          </Link>
          <Link href="/shop" className="btn-outline-luxe w-full sm:w-auto inline-block text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── Step indicator ── */
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-8 sm:mb-12">
      <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            step >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
          }`}
        >
          1
        </div>
        <span className="eyebrow hidden sm:inline">Shipping</span>
      </div>
      <div className="hidden sm:block w-16 h-px bg-muted-foreground" />
      <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            step >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
          }`}
        >
          2
        </div>
        <span className="eyebrow hidden sm:inline">Review</span>
      </div>
    </div>
  );

  /* ── Step 1: Shipping Address ── */
  if (step === 1) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-20">
        <h1 className="text-3xl sm:text-5xl text-center">Checkout</h1>
        {renderStepIndicator()}

        <form onSubmit={continueToReview} className="mt-8 space-y-8">
          {/* Shipping Address */}
          <section>
            <h2 className="eyebrow text-xs text-muted-foreground mb-4 pb-2 border-b">Shipping Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Full name</span>
                <input
                  name="full_name"
                  required
                  value={shipping.full_name}
                  onChange={handleChange}
                  className={`${field} mt-1`}
                  placeholder="Your full name"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Phone number</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={shipping.phone}
                  onChange={handleChange}
                  className={`${field} mt-1`}
                  placeholder="+213 XXX XXX XXX"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Address</span>
                <input
                  name="address_line"
                  required
                  value={shipping.address_line}
                  onChange={handleChange}
                  className={`${field} mt-1`}
                  placeholder="Street address, apartment, floor…"
                />
              </label>
              <label>
                <span className="text-xs text-muted-foreground">City</span>
                <input
                  name="city"
                  required
                  value={shipping.city}
                  onChange={handleChange}
                  className={`${field} mt-1`}
                  placeholder="City"
                />
              </label>
              <label>
                <span className="text-xs text-muted-foreground">Postal code</span>
                <input
                  name="postal_code"
                  required
                  value={shipping.postal_code}
                  onChange={handleChange}
                  className={`${field} mt-1`}
                  placeholder="Postal code"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Country</span>
                <input
                  name="country"
                  required
                  value={shipping.country}
                  onChange={handleChange}
                  className={`${field} mt-1`}
                  placeholder="Country"
                />
              </label>
            </div>
          </section>

          {/* Payment Method (info only) */}
          <section>
            <h2 className="eyebrow text-xs text-muted-foreground mb-4 pb-2 border-b">Payment Method</h2>
            <div className="border bg-card p-4 sm:p-5 flex items-start gap-4">
              <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pay when your order arrives at your doorstep. No online payment required.
                </p>
              </div>
            </div>
          </section>

          {/* Continue button */}
          <div className="pt-4 border-t">
            <button type="submit" className="btn-luxe w-full cursor-pointer">
              Continue to Review
            </button>
            <Link
              href="/cart"
              className="block text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
            >
              ← Back to bag
            </Link>
          </div>
        </form>
      </div>
    );
  }

  /* ── Step 2: Review & Confirm ── */
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-20">
      <h1 className="text-3xl sm:text-5xl text-center">Checkout</h1>
      {renderStepIndicator()}

      <div className="mt-8 sm:mt-14 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* ── Left: Shipping Address (read-only) + Payment ── */}
        <div className="lg:col-span-3 space-y-8">
          {/* Shipping Address Review */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="eyebrow text-xs text-muted-foreground">Shipping Address</h2>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="eyebrow text-xs text-primary hover:text-primary/80 cursor-pointer"
              >
                Edit
              </button>
            </div>
            <div className="border bg-card p-4 sm:p-5 text-sm">
              <p className="font-medium">{shipping.full_name}</p>
              <p className="mt-1">{shipping.phone}</p>
              <p className="mt-1">{shipping.address_line}</p>
              <p className="mt-1">
                {shipping.city} {shipping.postal_code && `, ${shipping.postal_code}`}
              </p>
              <p className="mt-1">{shipping.country}</p>
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="eyebrow text-xs text-muted-foreground mb-4 pb-2 border-b">Payment Method</h2>
            <div className="border bg-card p-4 sm:p-5 flex items-start gap-4">
              <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pay when your order arrives at your doorstep. No online payment required.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="lg:col-span-2">
          <div className="border bg-card p-5 sm:p-6 sticky top-28">
            <h2 className="eyebrow text-xs text-muted-foreground mb-4 pb-2 border-b">
              Order Summary &middot; {itemCount} {itemCount === 1 ? "item" : "items"}
            </h2>

            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {items.map(({ p, qty }) => (
                <div key={p.id} className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={productImage(p)}
                      alt={p.name}
                      className="h-16 w-16 object-cover bg-background shadow-xs"
                    />
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-medium">
                      {qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                    <p className="text-sm mt-1">{formatPrice(p.price * qty)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span>On delivery</span>
              </div>
              <div className="flex justify-between pt-3 border-t text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={placeOrder}
              disabled={busy}
              className="btn-luxe w-full mt-6 cursor-pointer"
            >
              {busy ? "Placing order…" : "Confirm Order"}
            </button>

            <Link
              href="/cart"
              className="block text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
            >
              ← Back to bag
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}