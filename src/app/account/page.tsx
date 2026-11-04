"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/products";
import { Order } from "@/lib/types";

const field =
  "w-full border bg-background px-4 py-3 text-base sm:text-sm outline-none focus:border-primary min-h-[44px]";

const fields = [
  ["full_name", "Full name"],
  ["phone", "Phone"],
  ["address_line", "Address"],
  ["city", "City"],
  ["postal_code", "Postal code"],
  ["country", "Country"],
] as const;

export default function AccountPage() {
  const { user, profile, updateProfile, signOut, ready } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/auth");
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.error("Error loading orders:", err))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const row = Object.fromEntries(fields.map(([k]) => [k, String(f.get(k) ?? "").trim()]));
    setSaving(true);
    const res = await updateProfile(row);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Profile saved");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (!ready || !user) {
    return <div className="py-24 sm:py-32 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6 sm:pb-8">
        <div>
          <p className="eyebrow text-muted-foreground text-xs">{user.email}</p>
          <h1 className="mt-1 sm:mt-2 text-3xl sm:text-5xl">My Account</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="eyebrow link-underline text-xs text-muted-foreground hover:text-foreground w-fit py-1 cursor-pointer"
        >
          Sign out
        </button>
      </div>

      {/* Profile & Shipping */}
      <section className="mt-10 sm:mt-14">
        <h2 className="text-2xl sm:text-3xl">Profile & Shipping</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Used automatically for shipping when placing orders.
        </p>

        <form key={profile?.updated_at || "form"} onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(([k, label]) => (
            <label key={k} className={k === "address_line" ? "sm:col-span-2" : ""}>
              <span className="eyebrow text-xs text-muted-foreground">{label}</span>
              <input
                name={k}
                defaultValue={(profile as any)?.[k] ?? ""}
                className={`${field} mt-1.5`}
              />
            </label>
          ))}
          <div className="sm:col-span-2 pt-2">
            <button disabled={saving} className="btn-luxe w-full sm:w-auto cursor-pointer">
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      {/* My Orders */}
      <section className="mt-14 sm:mt-20">
        <h2 className="text-2xl sm:text-3xl">My Orders</h2>
        {loadingOrders ? (
          <p className="mt-6 text-muted-foreground">Loading orders…</p>
        ) : orders?.length === 0 ? (
          <div className="mt-6 p-8 border text-center">
            <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="btn-outline-luxe mt-4 inline-block">
              Discover jewelry
            </Link>
          </div>
        ) : (
          <div className="mt-6 divide-y border-y">
            {orders?.map((o) => (
              <div key={o.id} className="py-6 flex flex-col md:grid md:grid-cols-3 gap-4">
                <div>
                  <p className="eyebrow text-xs">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 font-medium text-base sm:text-lg">{formatPrice(Number(o.total))}</p>
                  <span className="inline-block mt-2 eyebrow text-[10px] uppercase border px-2 py-0.5 bg-card">
                    {o.status}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {o.full_name || "—"} {o.phone && `· ${o.phone}`}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {[o.address_line, o.city, o.postal_code, o.country].filter(Boolean).join(", ") ||
                      "No address given"}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="eyebrow mb-1">Items</p>
                  <ul className="space-y-1">
                    {o.order_items?.map((item) => (
                      <li key={item.id}>
                        {item.quantity} &times; {item.product_name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

