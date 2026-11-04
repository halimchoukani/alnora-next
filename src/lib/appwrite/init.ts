import { createAdminClient } from "./server";
import { appwriteConfig } from "./config";
import { defaultProducts } from "../products";
import { ID, Permission, Role } from "node-appwrite";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function initializeAppwrite() {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error(
      "Appwrite credentials not provided. Please set NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY in .env.local"
    );
  }

  const { databases } = admin;
  const dbId = appwriteConfig.databaseId;

  // 1. Ensure Database exists
  try {
    await databases.get(dbId);
  } catch {
    await databases.create(dbId, "ALNORA Fine Jewelry");
  }

  const publicPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  async function ensureCollection(colId: string, colName: string) {
    try {
      await databases.getCollection(dbId, colId);
    } catch {
      await databases.createCollection(dbId, colId, colName, publicPermissions);
    }
  }

  await ensureCollection(appwriteConfig.collections.products, "Products");
  await ensureCollection(appwriteConfig.collections.profiles, "Profiles");
  await ensureCollection(appwriteConfig.collections.cart, "Cart Items");
  await ensureCollection(appwriteConfig.collections.orders, "Orders");
  await ensureCollection(appwriteConfig.collections.orderItems, "Order Items");

  async function ensureAttr(colId: string, createFn: () => Promise<any>) {
    try {
      await createFn();
    } catch { }
  }

  // Profiles
  const profCol = appwriteConfig.collections.profiles;
  await ensureAttr(profCol, () => databases.createStringAttribute(dbId, profCol, "full_name", 255, false));
  await ensureAttr(profCol, () => databases.createStringAttribute(dbId, profCol, "phone", 50, false));
  await ensureAttr(profCol, () => databases.createStringAttribute(dbId, profCol, "address_line", 500, false));
  await ensureAttr(profCol, () => databases.createStringAttribute(dbId, profCol, "city", 100, false));
  await ensureAttr(profCol, () => databases.createStringAttribute(dbId, profCol, "postal_code", 50, false));
  await ensureAttr(profCol, () => databases.createStringAttribute(dbId, profCol, "country", 100, false));

  // Cart
  const cartCol = appwriteConfig.collections.cart;
  await ensureAttr(cartCol, () => databases.createStringAttribute(dbId, cartCol, "user_id", 100, true));
  await ensureAttr(cartCol, () => databases.createStringAttribute(dbId, cartCol, "product_id", 100, true));
  await ensureAttr(cartCol, () => databases.createIntegerAttribute(dbId, cartCol, "quantity", true));

  // Products
  const prodCol = appwriteConfig.collections.products;
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "slug", 100, true));
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "name", 255, true));
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "collection", 100, false));
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "category", 50, true));
  await ensureAttr(prodCol, () => databases.createFloatAttribute(dbId, prodCol, "price", true));
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "image_url", 1000, false));
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "description", 2000, false));
  await ensureAttr(prodCol, () => databases.createStringAttribute(dbId, prodCol, "material", 500, false));
  await ensureAttr(prodCol, () => databases.createIntegerAttribute(dbId, prodCol, "stock", true, 0));
  await ensureAttr(prodCol, () => databases.createBooleanAttribute(dbId, prodCol, "is_active", true, true));

  // Orders
  const ordCol = appwriteConfig.collections.orders;
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "user_id", 100, true));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "status", 50, true));
  await ensureAttr(ordCol, () => databases.createFloatAttribute(dbId, ordCol, "total", true));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "full_name", 255, false));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "phone", 50, false));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "address_line", 500, false));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "city", 100, false));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "postal_code", 50, false));
  await ensureAttr(ordCol, () => databases.createStringAttribute(dbId, ordCol, "country", 100, false));

  // Order Items
  const itemCol = appwriteConfig.collections.orderItems;
  await ensureAttr(itemCol, () => databases.createStringAttribute(dbId, itemCol, "order_id", 100, true));
  await ensureAttr(itemCol, () => databases.createStringAttribute(dbId, itemCol, "product_id", 100, true));
  await ensureAttr(itemCol, () => databases.createStringAttribute(dbId, itemCol, "product_name", 255, true));
  await ensureAttr(itemCol, () => databases.createFloatAttribute(dbId, itemCol, "unit_price", true));
  await ensureAttr(itemCol, () => databases.createIntegerAttribute(dbId, itemCol, "quantity", true));

  // Wait for attributes
  async function waitForCols(cId: string) {
    for (let i = 0; i < 20; i++) {
      try {
        const col = await databases.getCollection(dbId, cId);
        const pending = col.attributes.filter((a: any) => a.status !== "available");
        if (pending.length === 0) break;
      } catch { }
      await sleep(500);
    }
  }

  await waitForCols(profCol);
  await waitForCols(cartCol);
  await waitForCols(prodCol);
  await waitForCols(ordCol);
  await waitForCols(itemCol);

  // Indexes
  async function ensureIdx(cId: string, key: string, type: string, attrs: string[]) {
    try {
      await databases.createIndex(dbId, cId, key, type as any, attrs);
    } catch { }
  }

  await ensureIdx(cartCol, "idx_cart_user_id", "key", ["user_id"]);
  await ensureIdx(prodCol, "idx_prod_slug", "unique", ["slug"]);
  await ensureIdx(prodCol, "idx_prod_active", "key", ["is_active"]);
  await ensureIdx(ordCol, "idx_orders_user_id", "key", ["user_id"]);
  await ensureIdx(itemCol, "idx_items_order_id", "key", ["order_id"]);

  // Seed default products
  try {
    const existing = await databases.listDocuments(dbId, prodCol);
    if (existing.total === 0) {
      for (const p of defaultProducts) {
        await databases.createDocument(dbId, prodCol, ID.unique(), p);
      }
    }
  } catch { }

  return { success: true, message: "Appwrite schema, attributes, indexes and initial products initialized successfully!" };
}
