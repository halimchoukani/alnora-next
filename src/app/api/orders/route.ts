import { NextRequest, NextResponse } from "next/server";
import { getOrdersStore, placeOrderStore } from "@/lib/server/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const orders = await getOrdersStore(userId);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "Sign in required to place order" }, { status: 401 });
    }
    const result = await placeOrderStore(userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to place order" }, { status: 400 });
  }
}

