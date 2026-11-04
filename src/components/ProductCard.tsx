import Link from "next/link";
import { formatPrice, productImage, type Product } from "@/lib/products";

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={`/product/${p.slug}`} className="group block focus:outline-none">
      <div className="bg-card overflow-hidden aspect-square shadow-2xs">
        <img
          src={productImage(p)}
          alt={p.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="pt-3 sm:pt-5 text-center px-1">
        <p className="eyebrow text-[10px] sm:text-xs text-muted-foreground">{p.collection}</p>
        <h3 className="mt-1.5 sm:mt-2 text-lg sm:text-xl font-display">{p.name}</h3>
        <p className="mt-1 text-xs sm:text-sm font-light">{formatPrice(p.price)}</p>
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ n = 3 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}>
          <div className="bg-card aspect-square animate-pulse" />
          <div className="mt-5 h-4 bg-card mx-auto w-1/2" />
        </div>
      ))}
    </>
  );
}

