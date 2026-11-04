"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { categories, type Category, type Product } from "@/lib/products";
import { ProductCard, ProductGridSkeleton } from "@/components/ProductCard";

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as Category | null;
  const currentCategory = categories.some((x) => x.id === categoryParam) ? categoryParam : null;

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Failed to load products:", err));
  }, []);

  const active = products?.filter((p) => p.is_active);
  const list = active && currentCategory ? active.filter((p) => p.category === currentCategory) : active;

  const tabClass = (isActive: boolean) =>
    `eyebrow py-1.5 px-2 transition-colors ${
      isActive ? "link-underline text-foreground" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-20">
      <h1 className="text-center text-3xl sm:text-4xl md:text-5xl">
        {currentCategory ? categories.find((c) => c.id === currentCategory)?.label : "All Jewelry"}
      </h1>

      <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2">
        <Link href="/shop" className={tabClass(!currentCategory)}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.id}`}
            className={tabClass(currentCategory === c.id)}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-10 sm:mt-16 grid gap-6 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list ? (
          list.map((p) => <ProductCard key={p.id} p={p} />)
        ) : (
          <ProductGridSkeleton n={6} />
        )}
        {list && !list.length && (
          <p className="col-span-full text-center text-muted-foreground py-12">No pieces here yet.</p>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center"><ProductGridSkeleton n={6} /></div>}>
      <ShopContent />
    </Suspense>
  );
}

