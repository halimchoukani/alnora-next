import { Suspense } from "react";
import ProductDetailClient from "./ProductDetailClient";
import { defaultProducts } from "@/lib/products";

export function generateStaticParams() {
  return defaultProducts.map((p) => ({
    slug: p.slug,
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-16">
          <div className="bg-card aspect-square max-w-xl mx-auto animate-pulse" />
        </div>
      }
    >
      <ProductDetailClient slug={slug} />
    </Suspense>
  );
}
