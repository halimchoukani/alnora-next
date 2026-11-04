"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, productImage, type Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { add, lines } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.product) {
          setProduct(data.product);
        } else {
          setProduct(null);
        }
      })
      .catch((err) => console.error("Error loading product:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-16">
        <div className="bg-card aspect-square max-w-xl mx-auto animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 sm:py-32 text-center px-4">
        <h1 className="text-3xl sm:text-4xl">Piece not found</h1>
        <Link href="/shop" className="btn-luxe mt-6 sm:mt-8 w-full sm:w-auto inline-block text-center">
          Back to shop
        </Link>
      </div>
    );
  }

  const inBag = lines.find((l) => l.productId === product.id || l.productId === product.slug)?.qty ?? 0;
  const soldOut = product.stock <= inBag;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-16">
      <div className="mb-6">
        <Link
          href="/shop"
          className="eyebrow text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to all jewelry
        </Link>
      </div>

      <div className="grid gap-8 sm:gap-12 md:gap-16 md:grid-cols-2 items-start">
        <div className="bg-card aspect-square overflow-hidden max-w-xl w-full mx-auto shadow-sm">
          <img
            src={productImage(product)}
            alt={product.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <p className="eyebrow text-muted-foreground">{product.collection} collection</p>
          <h1 className="mt-2 sm:mt-4 text-3xl sm:text-4xl md:text-5xl leading-tight">{product.name}</h1>
          <p className="mt-3 sm:mt-4 text-xl sm:text-2xl font-light">{formatPrice(product.price)}</p>
          <p className="mt-6 sm:mt-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 pt-6 border-t border-border/60">
            <p className="text-sm">
              <span className="eyebrow mr-3 text-muted-foreground">Material</span>
              <span className="font-normal">{product.material}</span>
            </p>
          </div>

          <button
            disabled={soldOut}
            className="btn-luxe mt-8 sm:mt-10 w-full disabled:opacity-50"
            onClick={() => {
              add(product.id);
              setAdded(true);
            }}
          >
            {product.stock === 0
              ? "Sold out"
              : soldOut
              ? "All available pieces are in your bag"
              : added
              ? "Added to bag"
              : "Add to bag"}
          </button>

          {added && (
            <Link
              href="/cart"
              className="mt-4 block text-center eyebrow text-xs link-underline w-fit mx-auto p-1"
            >
              View bag
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

