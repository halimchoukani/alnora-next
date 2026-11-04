import { NextRequest, NextResponse } from "next/server";
import { getProductsStore, createProductStore } from "@/lib/server/store";
import { isUserAdmin } from "@/lib/server/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeHidden = searchParams.get("all") === "true";
    const products = await getProductsStore(includeHidden);
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || req.headers.get("x-user-id");

    // Strictly enforce admin only
    const adminAuthorized = await isUserAdmin(userId);
    if (!adminAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can add products." },
        { status: 403 }
      );
    }

    const { name, slug, collection, category, price, stock, image_url, material, description, is_active } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 });
    }

    const created = await createProductStore({
      name,
      slug: slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      collection: collection || "",
      category,
      price: Number(price),
      stock: Number(stock ?? 10),
      image_url: image_url || "",
      material: material || "",
      description: description || "",
      is_active: is_active !== false,
    });

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

