import { Client, Storage } from "node-appwrite";
import fs from "fs";
import path from "path";

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

const storage = new Storage(client);

async function check() {
  const bucketId = "6aeb83760009771b8d69";
  const b = await storage.getBucket(bucketId);
  console.log("Bucket details:", {
    id: b.$id,
    name: b.name,
    permissions: b.$permissions,
    fileSecurity: b.fileSecurity,
    enabled: b.enabled,
    maximumFileSize: b.maximumFileSize,
    allowedFileExtensions: b.allowedFileExtensions,
  });
  const files = await storage.listFiles(bucketId);
  console.log("Files currently in bucket:", files.total, files.files.map(f => ({ id: f.$id, name: f.name })));
}

check().catch(console.error);
