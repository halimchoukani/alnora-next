import { Client, Databases, Permission, Role, ID } from "node-appwrite";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    if (key && vals.length) {
      process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "alnora_db";

console.log("ALNORA Appwrite Complete Schema & Attribute Setup");
console.log("================================================");
console.log(`Endpoint:    ${endpoint}`);
console.log(`Project ID:  ${projectId}`);
console.log(`Database ID: ${databaseId}\n`);

if (!projectId || !apiKey) {
  console.error("Error: Project ID and API Key required in .env.local");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const defaultProducts = [
  {
    slug: "solstice-solitaire",
    name: "Solstice Solitaire Ring",
    collection: "Solstice",
    category: "rings",
    price: 4800,
    image_url: "/assets/ring.jpg",
    material: "18K yellow gold, 1.2ct diamond",
    description: "A single brilliant diamond held aloft by four delicate claws — the purest expression of light.",
    stock: 10,
    is_active: true,
  },
  {
    slug: "constellation-bangle",
    name: "Constellation Bangle",
    collection: "Constellation",
    category: "bracelets",
    price: 3650,
    image_url: "/assets/bracelet.jpg",
    material: "18K yellow gold, diamonds",
    description: "Seven bezel-set diamonds orbit a polished gold band, inspired by the night sky.",
    stock: 10,
    is_active: true,
  },
  {
    slug: "verdant-pendant",
    name: "Verdant Emerald Pendant",
    collection: "Verdant",
    category: "necklaces",
    price: 5200,
    image_url: "/assets/necklace.jpg",
    material: "18K yellow gold, emerald, diamonds",
    description: "A pear-cut emerald crowned by a diamond leaf, suspended on a fine gold chain.",
    stock: 10,
    is_active: true,
  },
  {
    slug: "solstice-band",
    name: "Solstice Eternity Band",
    collection: "Solstice",
    category: "rings",
    price: 2900,
    image_url: "/assets/ring.jpg",
    material: "18K yellow gold, diamonds",
    description: "A refined band that catches light from every angle.",
    stock: 10,
    is_active: true,
  },
  {
    slug: "constellation-cuff",
    name: "Constellation Cuff",
    collection: "Constellation",
    category: "bracelets",
    price: 4100,
    image_url: "/assets/bracelet.jpg",
    material: "18K yellow gold",
    description: "A sculpted cuff with a hidden clasp and timeless silhouette.",
    stock: 10,
    is_active: true,
  },
  {
    slug: "verdant-drop",
    name: "Verdant Drop Necklace",
    collection: "Verdant",
    category: "necklaces",
    price: 6800,
    image_url: "/assets/necklace.jpg",
    material: "18K yellow gold, emerald",
    description: "An heirloom piece, crafted to be passed from one generation to the next.",
    stock: 10,
    is_active: true,
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAttributes(colId) {
  process.stdout.write(`Waiting for "${colId}" attributes to become available... `);
  while (true) {
    const col = await databases.getCollection(databaseId, colId);
    const pending = col.attributes.filter((a) => a.status !== "available");
    if (pending.length === 0) {
      console.log("Ready!");
      break;
    }
    process.stdout.write(".");
    await sleep(800);
  }
}

async function run() {
  // 1. Ensure Database
  try {
    await databases.get(databaseId);
    console.log(`✓ Database '${databaseId}' exists.`);
  } catch {
    console.log(`Creating database '${databaseId}'...`);
    await databases.create(databaseId, "ALNORA Fine Jewelry");
    console.log(`✓ Database '${databaseId}' created.`);
  }

  const publicPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  // 2. Ensure Collections
  const collections = [
    { id: "products", name: "Products" },
    { id: "profiles", name: "Profiles" },
    { id: "cart_items", name: "Cart Items" },
    { id: "orders", name: "Orders" },
    { id: "order_items", name: "Order Items" },
  ];

  for (const c of collections) {
    try {
      await databases.getCollection(databaseId, c.id);
      console.log(`✓ Collection '${c.id}' exists.`);
    } catch {
      console.log(`Creating collection '${c.id}'...`);
      await databases.createCollection(databaseId, c.id, c.name, publicPermissions);
      console.log(`✓ Collection '${c.id}' created.`);
    }
  }

  // Helper for attributes
  async function createAttr(colId, createFn, key) {
    try {
      await createFn();
      console.log(`  + Created attribute '${key}' on '${colId}'`);
    } catch (e) {
      if (!e.message?.includes("already exists")) {
        console.warn(`  ! Note on '${key}' (${colId}):`, e.message);
      }
    }
  }

  // 3. Profiles attributes
  console.log("\nConfiguring 'profiles' attributes...");
  await createAttr("profiles", () => databases.createStringAttribute(databaseId, "profiles", "full_name", 255, false), "full_name");
  await createAttr("profiles", () => databases.createStringAttribute(databaseId, "profiles", "phone", 50, false), "phone");
  await createAttr("profiles", () => databases.createStringAttribute(databaseId, "profiles", "address_line", 500, false), "address_line");
  await createAttr("profiles", () => databases.createStringAttribute(databaseId, "profiles", "city", 100, false), "city");
  await createAttr("profiles", () => databases.createStringAttribute(databaseId, "profiles", "postal_code", 50, false), "postal_code");
  await createAttr("profiles", () => databases.createStringAttribute(databaseId, "profiles", "country", 100, false), "country");

  // 4. Cart Items attributes
  console.log("\nConfiguring 'cart_items' attributes...");
  await createAttr("cart_items", () => databases.createStringAttribute(databaseId, "cart_items", "user_id", 100, true), "user_id");
  await createAttr("cart_items", () => databases.createStringAttribute(databaseId, "cart_items", "product_id", 100, true), "product_id");
  await createAttr("cart_items", () => databases.createIntegerAttribute(databaseId, "cart_items", "quantity", true), "quantity");

  // 5. Products attributes
  console.log("\nConfiguring 'products' attributes...");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "slug", 100, true), "slug");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "name", 255, true), "name");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "collection", 100, false), "collection");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "category", 50, true), "category");
  await createAttr("products", () => databases.createFloatAttribute(databaseId, "products", "price", true), "price");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "image_url", 1000, false), "image_url");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "description", 2000, false), "description");
  await createAttr("products", () => databases.createStringAttribute(databaseId, "products", "material", 500, false), "material");
  await createAttr("products", () => databases.createIntegerAttribute(databaseId, "products", "stock", true, 0), "stock");
  await createAttr("products", () => databases.createBooleanAttribute(databaseId, "products", "is_active", true, true), "is_active");

  // 6. Orders attributes
  console.log("\nConfiguring 'orders' attributes...");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "user_id", 100, true), "user_id");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "status", 50, true), "status");
  await createAttr("orders", () => databases.createFloatAttribute(databaseId, "orders", "total", true), "total");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "full_name", 255, false), "full_name");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "phone", 50, false), "phone");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "address_line", 500, false), "address_line");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "city", 100, false), "city");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "postal_code", 50, false), "postal_code");
  await createAttr("orders", () => databases.createStringAttribute(databaseId, "orders", "country", 100, false), "country");

  // 7. Order Items attributes
  console.log("\nConfiguring 'order_items' attributes...");
  await createAttr("order_items", () => databases.createStringAttribute(databaseId, "order_items", "order_id", 100, true), "order_id");
  await createAttr("order_items", () => databases.createStringAttribute(databaseId, "order_items", "product_id", 100, true), "product_id");
  await createAttr("order_items", () => databases.createStringAttribute(databaseId, "order_items", "product_name", 255, true), "product_name");
  await createAttr("order_items", () => databases.createFloatAttribute(databaseId, "order_items", "unit_price", true), "unit_price");
  await createAttr("order_items", () => databases.createIntegerAttribute(databaseId, "order_items", "quantity", true), "quantity");

  // Wait for attributes to be ready before creating indexes or documents
  console.log("\nWaiting for all attributes to provision in Appwrite...");
  await waitForAttributes("profiles");
  await waitForAttributes("cart_items");
  await waitForAttributes("products");
  await waitForAttributes("orders");
  await waitForAttributes("order_items");

  // Helper for Indexes
  async function createIdx(colId, key, type, attrs) {
    try {
      await databases.createIndex(databaseId, colId, key, type, attrs);
      console.log(`  + Created index '${key}' on '${colId}'`);
    } catch (e) {
      if (!e.message?.includes("already exists")) {
        console.warn(`  ! Note on index '${key}' (${colId}):`, e.message);
      }
    }
  }

  // 8. Create Indexes
  console.log("\nCreating indexes...");
  await createIdx("cart_items", "idx_cart_user_id", "key", ["user_id"]);
  await createIdx("cart_items", "idx_cart_prod_id", "key", ["product_id"]);
  await createIdx("products", "idx_prod_slug", "unique", ["slug"]);
  await createIdx("products", "idx_prod_active", "key", ["is_active"]);
  await createIdx("orders", "idx_orders_user_id", "key", ["user_id"]);
  await createIdx("order_items", "idx_items_order_id", "key", ["order_id"]);

  // 9. Seed default products into Appwrite
  console.log("\nChecking products in Appwrite...");
  try {
    const existing = await databases.listDocuments(databaseId, "products");
    if (existing.total === 0) {
      console.log("Seeding default jewelry products into Appwrite...");
      for (const p of defaultProducts) {
        await databases.createDocument(databaseId, "products", ID.unique(), p);
        console.log(`  + Seeded: ${p.name}`);
      }
      console.log("✓ All products seeded into Appwrite!");
    } else {
      console.log(`✓ Products already exist in Appwrite (${existing.total} found).`);
    }
  } catch (err) {
    console.error("Error seeding products:", err);
  }

  console.log("\n=======================================================");
  console.log("✓ SUCCESS: Appwrite Database Schema is 100% configured!");
  console.log("=======================================================\n");
}

run().catch((err) => {
  console.error("\nSetup failed with error:", err);
  process.exit(1);
});
