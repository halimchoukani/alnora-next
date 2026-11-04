import Link from "next/link";

export const metadata = {
  title: "The Maison — ALNORA",
  description: "The story and craftsmanship behind ALNORA fine jewelry.",
};

export default function MaisonPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-20 grid gap-8 sm:gap-12 md:gap-16 md:grid-cols-2 items-center">
      <div className="overflow-hidden bg-card shadow-sm">
        <img
          src="/assets/hero.jpg"
          alt="ALNORA jewelry"
          loading="lazy"
          width={1920}
          height={1088}
          className="aspect-[4/5] object-cover w-full"
        />
      </div>
      <div>
        <p className="eyebrow text-primary">The Maison</p>
        <h1 className="mt-3 sm:mt-4 text-3xl sm:text-4xl md:text-5xl leading-tight">Crafted to be treasured</h1>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
          ALNORA was born from a love of light and gold. Each piece is designed with intention and finished by hand, using ethically sourced stones and 18K gold.
        </p>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          From everyday accessories to heirloom creations, our jewels are made to mark the moments that matter.
        </p>
        <Link href="/shop" className="btn-outline-luxe mt-8 sm:mt-10 w-full sm:w-auto inline-block text-center">
          Explore the collection
        </Link>
      </div>
    </div>
  );
}

