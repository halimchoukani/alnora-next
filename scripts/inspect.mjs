import { Client, Databases } from "node-appwrite";
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

async function inspect() {
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "alnora_db";
  console.log("Checking database:", dbId);
  const cols = await db.listCollections(dbId);
  console.log(`Found ${cols.total} collections.`);
  for (const c of cols.collections) {
    console.log(`\nCollection: "${c.$id}" (${c.name})`);
    console.log(`Attributes (${c.attributes.length}):`, c.attributes.map(a => `${a.key} (${a.type}, status: ${a.status})`));
    console.log(`Indexes (${c.indexes.length}):`, c.indexes.map(i => `${i.key} on [${i.attributes.join(", ")}]`));
  }
}

inspect().catch(console.error);

