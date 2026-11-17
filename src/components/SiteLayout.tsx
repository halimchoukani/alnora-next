"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { categories } from "@/lib/products";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close the menu on route change (popstate does NOT fire for Next.js <Link> navigation)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape, close when the viewport grows to desktop, lock body scroll while open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onChange);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Top Banner */}
      <div className="bg-foreground text-background text-center eyebrow py-2 px-4 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.3em] leading-snug">
        Complimentary shipping & gift wrapping
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        {/*
          Mobile: 3-column grid so the logo is truly centered (hamburger | logo | actions).
          Desktop: logo left, actions right.
        */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between">
          {/* Hamburger - mobile only */}
          <div className="flex items-center justify-start md:hidden">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={mobileMenuOpen ? closeMobileMenu : openMobileMenu}
              className="inline-flex h-11 w-11 -ml-3 items-center justify-center text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="justify-self-center md:justify-self-auto font-display text-xl min-[400px]:text-2xl sm:text-3xl tracking-[0.2em] min-[400px]:tracking-[0.25em] sm:tracking-[0.35em] whitespace-nowrap"
            onClick={closeMobileMenu}
          >
            ALNORA
          </Link>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1 sm:gap-4 md:gap-6 eyebrow">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden md:inline hover:text-primary transition-colors text-primary font-medium"
              >
                Admin
              </Link>
            )}
            <Link
              href={user ? "/account" : "/auth"}
              className="flex items-center justify-center gap-2 min-h-11 min-w-11 hover:text-primary transition-colors"
              aria-label={user ? "My account" : "Sign in"}
            >
              <User className="h-4 w-4" strokeWidth={1.25} />
              <span className="hidden md:inline">{user ? "Account" : "Sign in"}</span>
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-11 min-w-11 -mr-2 sm:mr-0 hover:text-primary transition-colors"
              aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.25} />
              <span className="text-xs sm:text-sm tabular-nums">({count})</span>
            </Link>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav
          className="hidden md:flex justify-center gap-8 lg:gap-10 eyebrow py-4 border-t"
          aria-label="Main navigation"
        >
          <Link href="/shop" className="hover:text-primary transition-colors">
            Jewelry
          </Link>
          <Link href="/shop?category=rings" className="hover:text-primary transition-colors">
            Rings
          </Link>
          <Link href="/maison" className="hover:text-primary transition-colors">
            Maison
          </Link>
        </nav>
      </header>

      {/*
        Mobile menu lives OUTSIDE <header>. The header uses backdrop-blur (backdrop-filter),
        which makes it the containing block for `position: fixed` children, so a drawer
        nested inside would be sized to the header instead of the viewport.
      */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer slides from the left, the same side as the hamburger button */}
          <div
            id="mobile-menu"
            className="md:hidden fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm h-dvh bg-background border-r shadow-xl animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex flex-col h-full overflow-y-auto overscroll-contain px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-start justify-between pb-6 border-b">
                <div>
                  <p className="font-display text-2xl tracking-[0.3em]">ALNORA</p>
                  <p className="eyebrow text-[10px] text-muted-foreground mt-1">Fine Jewelry</p>
                </div>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="inline-flex h-11 w-11 -mr-3 items-center justify-center text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex flex-col gap-2 py-4 flex-1" aria-label="Mobile navigation">
                <Link
                  href="/shop"
                  onClick={closeMobileMenu}
                  className="py-3 text-lg font-display tracking-wider hover:text-primary transition-colors"
                >
                  All Jewelry
                </Link>
                <div className="ml-1 pl-4 flex flex-col border-l border-border/60">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/shop?category=${c.id}`}
                      onClick={closeMobileMenu}
                      className="py-2.5 eyebrow text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/maison"
                  onClick={closeMobileMenu}
                  className="py-3 text-lg font-display tracking-wider hover:text-primary transition-colors"
                >
                  The Maison
                </Link>
              </nav>

              <div className="pt-4 border-t flex flex-col">
                <Link
                  href={user ? "/account" : "/auth"}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 min-h-11 text-sm font-medium hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  <span>{user ? "My Account" : "Sign in / Register"}</span>
                </Link>
                <Link
                  href="/cart"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between min-h-11 text-sm font-medium hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                    <span>Shopping Bag</span>
                  </div>
                  <span className="eyebrow text-xs bg-card px-2 py-0.5 border">{count}</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="flex items-center min-h-11 eyebrow text-xs text-primary font-medium"
                  >
                    Store Admin Panel
                  </Link>
                )}
              </div>

              <div className="pt-4 mt-2 border-t text-xs text-muted-foreground">
                <p className="eyebrow text-[10px]">Client Concierge</p>
                <p className="mt-1">Free returns within 30 days & insured delivery worldwide.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t mt-16 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 text-sm">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-2xl tracking-[0.3em]">ALNORA</p>
            <p className="mt-4 max-w-xs text-muted-foreground leading-relaxed">
              Fine jewelry and accessories, crafted to be treasured.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Shop</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                All jewelry
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4">Maison</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/maison" className="text-muted-foreground hover:text-foreground transition-colors">
                Our story
              </Link>
              <p className="text-muted-foreground">18K Ethical Gold</p>
              <p className="text-muted-foreground">Certified Stones</p>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="eyebrow mb-4">Client care</p>
            <div className="flex flex-col gap-2.5 text-muted-foreground">
              <p>Free returns within 30 days</p>
              <p>Complimentary gift packaging</p>
              <p>Certificate of authenticity</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border/40 py-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-center eyebrow text-[10px] sm:text-xs text-muted-foreground">
            &copy; 2026 ALNORA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}