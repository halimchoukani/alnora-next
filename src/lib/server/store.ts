import { defaultProducts, Product } from "@/lib/products";
import { Order, OrderItem, Profile } from "@/lib/types";
import { createAdminClient } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";

// In-memory fallback store when Appwrite is not configured
let memoryProducts: Product[] = [...defaultProducts];
let memoryProfiles: Record<string, Profile> = {};
let memoryCarts: Record<string, { productId: string; qty: number }[]> = {};
let memoryOrders: Order[] = [];
let memoryOrderItems: OrderItem[] = [];

export async function getProductsStore(includeHidden = false): Promise<Product[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const queries = includeHidden ? [] : [Query.equal("is_active", true)];
      const res = await admin.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        queries
      );
      if (res.documents.length > 0) {
        return res.documents.map((doc: any) => ({
          id: doc.$id,
          slug: doc.slug,
          name: doc.name,
          collection: doc.collection || "",
          category: doc.category,
          price: Number(doc.price),
          image_url: doc.image_url || "",
          description: doc.description || "",
          material: doc.material || "",
          stock: Number(doc.stock ?? 10),
          is_active: Boolean(doc.is_active ?? true),
          created_at: doc.$createdAt,
        }));
      }
    } catch (err) {
      console.warn("Appwrite products fetch error, falling back to local store:", err);
    }
  }
  return includeHidden ? memoryProducts : memoryProducts.filter((p) => p.is_active);
}

export async function getProductBySlugStore(slug: string): Promise<Product | null> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const res = await admin.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        [Query.equal("slug", slug)]
      );
      if (res.documents.length > 0) {
        const doc: any = res.documents[0];
        return {
          id: doc.$id,
          slug: doc.slug,
          name: doc.name,
          collection: doc.collection || "",
          category: doc.category,
          price: Number(doc.price),
          image_url: doc.image_url || "",
          description: doc.description || "",
          material: doc.material || "",
          stock: Number(doc.stock ?? 10),
          is_active: Boolean(doc.is_active ?? true),
          created_at: doc.$createdAt,
        };
      }
    } catch (err) {
      console.warn("Appwrite product slug fetch error:", err);
    }
  }
  return memoryProducts.find((p) => p.slug === slug || p.id === slug) ?? null;
}

export async function createProductStore(data: Omit<Product, "id">): Promise<Product> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const doc = await admin.databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        ID.unique(),
        {
          slug: data.slug,
          name: data.name,
          collection: data.collection,
          category: data.category,
          price: data.price,
          image_url: data.image_url,
          description: data.description,
          material: data.material,
          stock: data.stock,
          is_active: data.is_active,
        }
      );
      return {
        id: doc.$id,
        ...data,
      };
    } catch (err) {
      console.error("Appwrite create product error:", err);
    }
  }
  const newProduct: Product = {
    ...data,
    id: `prod_${Date.now()}`,
  };
  memoryProducts.push(newProduct);
  return newProduct;
}

export async function updateProductStore(id: string, data: Partial<Product>): Promise<Product | null> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const updated = await admin.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        id,
        data
      );
      return {
        id: updated.$id,
        slug: updated.slug,
        name: updated.name,
        collection: updated.collection,
        category: updated.category,
        price: Number(updated.price),
        image_url: updated.image_url,
        description: updated.description,
        material: updated.material,
        stock: Number(updated.stock),
        is_active: Boolean(updated.is_active),
      };
    } catch (err) {
      console.error("Appwrite update product error:", err);
    }
  }
  const idx = memoryProducts.findIndex((p) => p.id === id || p.slug === id);
  if (idx !== -1) {
    memoryProducts[idx] = { ...memoryProducts[idx], ...data };
    return memoryProducts[idx];
  }
  return null;
}

export async function deleteProductStore(id: string): Promise<boolean> {
  const admin = createAdminClient();
  if (admin) {
    try {
      await admin.databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.products,
        id
      );
      return true;
    } catch (err) {
      console.error("Appwrite delete product error:", err);
    }
  }
  const prevLen = memoryProducts.length;
  memoryProducts = memoryProducts.filter((p) => p.id !== id && p.slug !== id);
  return memoryProducts.length < prevLen;
}

export async function getProfileStore(userId: string): Promise<Profile | null> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const doc = await admin.databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.profiles,
        userId
      );
      return {
        id: doc.$id,
        full_name: doc.full_name || "",
        phone: doc.phone || "",
        address_line: doc.address_line || "",
        city: doc.city || "",
        postal_code: doc.postal_code || "",
        country: doc.country || "",
        updated_at: doc.$updatedAt,
      };
    } catch {
      // Document might not exist yet
    }
  }
  return memoryProfiles[userId] ?? {
    id: userId,
    full_name: "",
    phone: "",
    address_line: "",
    city: "",
    postal_code: "",
    country: "",
  };
}

export async function saveProfileStore(userId: string, data: Partial<Profile>): Promise<Profile> {
  const admin = createAdminClient();
  const sanitized: Record<string, string> = {};
  if (data.full_name !== undefined) sanitized.full_name = String(data.full_name);
  if (data.phone !== undefined) sanitized.phone = String(data.phone);
  if (data.address_line !== undefined) sanitized.address_line = String(data.address_line);
  if (data.city !== undefined) sanitized.city = String(data.city);
  if (data.postal_code !== undefined) sanitized.postal_code = String(data.postal_code);
  if (data.country !== undefined) sanitized.country = String(data.country);

  if (admin) {
    try {
      let doc;
      try {
        doc = await admin.databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          userId
        );
        doc = await admin.databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          userId,
          sanitized
        );
      } catch {
        doc = await admin.databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          userId,
          sanitized
        );
      }
      return {
        id: doc.$id,
        full_name: doc.full_name || "",
        phone: doc.phone || "",
        address_line: doc.address_line || "",
        city: doc.city || "",
        postal_code: doc.postal_code || "",
        country: doc.country || "",
        updated_at: doc.$updatedAt,
      };
    } catch (err) {
      console.error("Appwrite save profile error:", err);
    }
  }
  memoryProfiles[userId] = {
    ...(memoryProfiles[userId] ?? { id: userId }),
    ...data,
    id: userId,
    updated_at: new Date().toISOString(),
  } as Profile;
  return memoryProfiles[userId];
}

export async function getCartStore(userId: string): Promise<{ productId: string; qty: number }[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const res = await admin.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.cart,
        [Query.equal("user_id", userId)]
      );
      return res.documents.map((d: any) => ({
        productId: d.product_id,
        qty: Number(d.quantity),
      }));
    } catch (err) {
      console.warn("Appwrite cart fetch error:", err);
    }
  }
  return memoryCarts[userId] ?? [];
}

export async function saveCartItemStore(userId: string, productId: string, qty: number) {
  const admin = createAdminClient();
  if (admin) {
    try {
      const existing = await admin.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.cart,
        [Query.equal("user_id", userId), Query.equal("product_id", productId)]
      );
      if (qty <= 0) {
        if (existing.documents.length > 0) {
          await admin.databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.cart,
            existing.documents[0].$id
          );
        }
      } else {
        if (existing.documents.length > 0) {
          await admin.databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.cart,
            existing.documents[0].$id,
            { quantity: qty }
          );
        } else {
          await admin.databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.cart,
            ID.unique(),
            { user_id: userId, product_id: productId, quantity: qty }
          );
        }
      }
      return;
    } catch (err) {
      console.error("Appwrite cart save error:", err);
    }
  }
  const current = memoryCarts[userId] ?? [];
  if (qty <= 0) {
    memoryCarts[userId] = current.filter((x) => x.productId !== productId);
  } else {
    const idx = current.findIndex((x) => x.productId === productId);
    if (idx !== -1) {
      current[idx].qty = qty;
    } else {
      current.push({ productId, qty });
    }
    memoryCarts[userId] = current;
  }
}

export async function placeOrderStore(userId: string): Promise<{ orderId: string }> {
  const products = await getProductsStore(true);
  const cart = await getCartStore(userId);

  if (!cart.length) {
    throw new Error("Your bag is empty");
  }

  // Validate stock and active
  const orderItemsData: { product: Product; qty: number }[] = [];
  let total = 0;

  for (const item of cart) {
    const p = products.find((prod) => prod.id === item.productId || prod.slug === item.productId);
    if (!p || !p.is_active || p.stock < item.qty) {
      throw new Error(`Piece "${p?.name || item.productId}" is no longer available in that quantity.`);
    }
    orderItemsData.push({ product: p, qty: item.qty });
    total += p.price * item.qty;
  }

  const profile = (await getProfileStore(userId)) || {
    id: userId,
    full_name: "",
    phone: "",
    address_line: "",
    city: "",
    postal_code: "",
    country: "",
  };

  const admin = createAdminClient();
  const orderId = `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  if (admin) {
    try {
      const orderDoc = await admin.databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        ID.unique(),
        {
          user_id: userId,
          status: "pending",
          total,
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          address_line: profile.address_line || "",
          city: profile.city || "",
          postal_code: profile.postal_code || "",
          country: profile.country || "",
        }
      );

      // Create order items
      for (const item of orderItemsData) {
        await admin.databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.orderItems,
          ID.unique(),
          {
            order_id: orderDoc.$id,
            product_id: item.product.id,
            product_name: item.product.name,
            unit_price: item.product.price,
            quantity: item.qty,
          }
        );

        // Update product stock
        await updateProductStore(item.product.id, {
          stock: Math.max(0, item.product.stock - item.qty),
        });
      }

      // Clear cart
      const cartDocs = await admin.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.cart,
        [Query.equal("user_id", userId)]
      );
      for (const d of cartDocs.documents) {
        await admin.databases.deleteDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.cart,
          d.$id
        );
      }

      return { orderId: orderDoc.$id };
    } catch (err) {
      console.error("Appwrite order placement error:", err);
    }
  }

  // Fallback memory order
  const newOrder: Order = {
    id: orderId,
    user_id: userId,
    status: "pending",
    total,
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    address_line: profile.address_line || "",
    city: profile.city || "",
    postal_code: profile.postal_code || "",
    country: profile.country || "",
    created_at: new Date().toISOString(),
    order_items: orderItemsData.map((item, idx) => ({
      id: `oi_${Date.now()}_${idx}`,
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.product.price,
      quantity: item.qty,
    })),
  };

  memoryOrders.unshift(newOrder);

  // Decrement stock
  for (const item of orderItemsData) {
    const idx = memoryProducts.findIndex((p) => p.id === item.product.id);
    if (idx !== -1) {
      memoryProducts[idx].stock = Math.max(0, memoryProducts[idx].stock - item.qty);
    }
  }

  // Clear memory cart
  memoryCarts[userId] = [];

  return { orderId };
}

export async function getOrdersStore(userId?: string): Promise<Order[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const queries = userId
        ? [Query.equal("$id", userId), Query.orderDesc("$createdAt")]
        : [Query.orderDesc("$createdAt")];

      const res = await admin.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        queries
      );

      const ordersWithItems: Order[] = [];
      for (const doc of res.documents) {
        const itemsRes = await admin.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.orderItems,
          [Query.equal("order_id", doc.$id)]
        );

        ordersWithItems.push({
          id: doc.$id,
          user_id: doc.user_id,
          status: doc.status,
          total: Number(doc.total),
          full_name: doc.full_name || "",
          phone: doc.phone || "",
          address_line: doc.address_line || "",
          city: doc.city || "",
          postal_code: doc.postal_code || "",
          country: doc.country || "",
          created_at: doc.$createdAt,
          order_items: itemsRes.documents.map((item: any) => ({
            id: item.$id,
            order_id: item.order_id,
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: Number(item.unit_price),
            quantity: Number(item.quantity),
          })),
        });
      }
      return ordersWithItems;
    } catch (err) {
      console.warn("Appwrite orders fetch error:", err);
    }
  }

  if (userId) {
    return memoryOrders.filter((o) => o.user_id === userId);
  }
  return memoryOrders;
}

export async function updateOrderStatusStore(orderId: string, status: any): Promise<boolean> {
  const admin = createAdminClient();
  if (admin) {
    try {
      await admin.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.orders,
        orderId,
        { status }
      );
      return true;
    } catch (err) {
      console.error("Appwrite order status update error:", err);
    }
  }
  const order = memoryOrders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    return true;
  }
  return false;
}

