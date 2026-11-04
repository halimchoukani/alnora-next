import { Client, Databases, Query } from "node-appwrite";
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

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "alnora_db";

async function test() {
  console.log("1. Fetching products from Appwrite...");
  const prods = await db.listDocuments(dbId, "products", [Query.equal("is_active", true)]);
  console.log(`   Found ${prods.total} active products.`);

  const testUid = "6aeb852b001d24c6581e";

  console.log("\n2. Saving profile for user:", testUid);
  let profDoc;
  try {
    profDoc = await db.getDocument(dbId, "profiles", testUid);
    profDoc = await db.updateDocument(dbId, "profiles", testUid, {
      full_name: "Test User",
      city: "Paris",
    });
  } catch {
    profDoc = await db.createDocument(dbId, "profiles", testUid, {
      full_name: "Test User",
      city: "Paris",
    });
  }
  console.log("   Profile successfully saved in Appwrite:", profDoc.$id, profDoc.full_name);

  console.log("\n3. Querying cart for user:", testUid);
  const cartDocs = await db.listDocuments(dbId, "cart_items", [Query.equal("user_id", testUid)]);
  console.log(`   Cart query successful: ${cartDocs.total} items found.`);

  console.log("\nAll Appwrite operations are working smoothly with zero schema or attribute errors!");
}

test().catch(console.error);

