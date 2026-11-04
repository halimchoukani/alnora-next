import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";
import { isUserAdmin } from "@/lib/server/admin-auth";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = (formData.get("userId") as string) || req.headers.get("x-user-id");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Enforce Admin Only for uploading product images
    const adminAuthorized = await isUserAdmin(userId);
    if (!adminAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can upload product images." },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Appwrite storage is not configured." },
        { status: 500 }
      );
    }

    // Convert browser File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const inputFile = InputFile.fromBuffer(buffer, file.name || "product_image.jpg");

    // Upload to Appwrite Storage Bucket
    const uploaded = await adminClient.storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile
    );

    const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${uploaded.$id}/view?project=${appwriteConfig.projectId}`;
    const previewUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${uploaded.$id}/preview?project=${appwriteConfig.projectId}&width=1000`;

    return NextResponse.json({
      fileId: uploaded.$id,
      fileUrl,
      previewUrl,
    });
  } catch (error: any) {
    console.error("Appwrite image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to Appwrite Storage" },
      { status: 500 }
    );
  }
}

