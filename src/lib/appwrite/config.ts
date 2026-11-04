export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "alnora_db",
  collections: {
    products: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PRODUCTS || "products",
    profiles: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROFILES || "profiles",
    cart: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CART || "cart_items",
    orders: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ORDERS || "orders",
    orderItems: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ORDER_ITEMS || "order_items",
  },
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "6aeb83760009771b8d69",
  apiKey: process.env.APPWRITE_API_KEY || "",
  isConfigured: Boolean(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
};

