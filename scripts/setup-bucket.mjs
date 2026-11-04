import { Client, Storage, Permission, Role, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
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

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "6aeb83760009771b8d69";

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const storage = new Storage(client);

async function setupBucket() {
  console.log(`Configuring Appwrite Storage Bucket "${bucketId}"...`);
  
  const publicPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];

  try {
    await storage.updateBucket(
      bucketId,
      "Images",
      publicPermissions,
      false, // fileSecurity
      true,  // enabled
      50000000, // 50MB
      ["jpg", "jpeg", "png", "webp", "gif", "svg"] // allowed extensions
    );
    console.log(`✓ Bucket "${bucketId}" updated with public read and write permissions!`);
  } catch (err) {
    console.error("Failed to update bucket:", err);
  }

  // Upload local asset files if not present
  const assetsDir = path.resolve(process.cwd(), "public/assets");
  const assetFiles = ["ring.jpg", "bracelet.jpg", "necklace.jpg", "hero.jpg"];

  for (const file of assetFiles) {
    const filePath = path.join(assetsDir, file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const existing = await storage.listFiles(bucketId);
      const match = existing.files.find(f => f.name === file);
      if (match) {
        console.log(`✓ File "${file}" already exists in bucket (${match.$id})`);
        continue;
      }

      console.log(`Uploading "${file}" to Appwrite Storage...`);
      const inputFile = InputFile.fromPath(filePath, file);
      const uploaded = await storage.createFile(bucketId, ID.unique(), inputFile);
      console.log(`✓ Uploaded "${file}" -> File ID: ${uploaded.$id}`);
    } catch (err) {
      console.warn(`Could not upload ${file}:`, err.message);
    }
  }
}

setupBucket().catch(console.error);
