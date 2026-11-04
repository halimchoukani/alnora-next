import { NextRequest, NextResponse } from "next/server";
import { getCartStore, saveCartItemStore } from "@/lib/server/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ lines: [] });
    }
    const lines = await getCartStore(userId);
    return NextResponse.json({ lines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, qty } = body;
    if (!userId || !productId) {
      return NextResponse.json({ error: "userId and productId are required" }, { status: 400 });
    }
    await saveCartItemStore(userId, productId, Number(qty ?? 1));
    const lines = await getCartStore(userId);
    return NextResponse.json({ lines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update cart item" }, { status: 500 });
  }
}

// Merge guest cart on login
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items } = body; // items: [{ productId, qty }]
    if (!userId || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const current = await getCartStore(userId);
    for (const item of items) {
      const existing = current.find((x) => x.productId === item.productId);
      const newQty = (existing?.qty || 0) + item.qty;
      await saveCartItemStore(userId, item.productId, newQty);
    }
    const lines = await getCartStore(userId);
    return NextResponse.json({ lines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to sync cart" }, { status: 500 });
  }
}

