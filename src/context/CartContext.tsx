"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { CartLine } from "@/lib/types";

interface CartCtx {
  lines: CartLine[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  reload: () => Promise<void>;
  count: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "alnora-cart-v2";

const readGuest = (): CartLine[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const uid = user?.id ?? null;
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const reload = useCallback(async () => {
    if (!uidRef.current) {
      setLines(readGuest());
      return;
    }
    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(uidRef.current)}`);
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines || []);
      }
    } catch (err) {
      console.warn("Could not reload cart:", err);
    }
  }, []);

  // When someone signs in, move their guest bag into their account
  useEffect(() => {
    if (!ready) return;
    (async () => {
      if (uid) {
        const guest = readGuest();
        if (guest.length) {
          try {
            await fetch("/api/cart", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: uid, items: guest }),
            });
            localStorage.removeItem(KEY);
          } catch (err) {
            console.error("Cart sync error:", err);
          }
        }
      }
      await reload();
    })();
  }, [uid, ready, reload]);

  const persist = async (productId: string, qty: number) => {
    if (!uidRef.current) return;
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uidRef.current, productId, qty }),
      });
    } catch (err) {
      console.error("Cart persist error:", err);
    }
  };

  const update = (productId: string, fn: (q: number) => number) => {
    setLines((l) => {
      const cur = l.find((x) => x.productId === productId)?.qty ?? 0;
      const qty = fn(cur);
      const next =
        qty <= 0
          ? l.filter((x) => x.productId !== productId)
          : cur
          ? l.map((x) => (x.productId === productId ? { ...x, qty } : x))
          : [...l, { productId, qty }];

      if (!uidRef.current) {
        localStorage.setItem(KEY, JSON.stringify(next));
      }
      void persist(productId, qty);
      return next;
    });
  };

  const value: CartCtx = {
    lines,
    add: (id) => update(id, (q) => q + 1),
    remove: (id) => update(id, () => 0),
    setQty: (id, qty) => update(id, () => qty),
    reload,
    count: lines.reduce((s, x) => s + x.qty, 0),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}

