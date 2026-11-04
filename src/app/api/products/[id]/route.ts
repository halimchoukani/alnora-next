import { NextRequest, NextResponse } from "next/server";
import { getProductBySlugStore, updateProductStore, deleteProductStore } from "@/lib/server/store";
import { isUserAdmin } from "@/lib/server/admin-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getProductBySlugStore(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = body.userId || req.headers.get("x-user-id");

    const adminAuthorized = await isUserAdmin(userId);
    if (!adminAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can modify products." },
        { status: 403 }
      );
    }

    const updated = await updateProductStore(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || req.headers.get("x-user-id");

    const adminAuthorized = await isUserAdmin(userId);
    if (!adminAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can delete products." },
        { status: 403 }
      );
    }

    const success = await deleteProductStore(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}

