import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusStore } from "@/lib/server/store";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }
    const success = await updateOrderStatusStore(id, status);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 500 });
  }
}

