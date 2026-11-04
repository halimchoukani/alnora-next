import { NextResponse } from "next/server";
import { initializeAppwrite } from "@/lib/appwrite/init";

export async function POST() {
  try {
    const result = await initializeAppwrite();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to initialize Appwrite",
        instructions:
          "Ensure NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY are configured in .env.local",
      },
      { status: 500 }
    );
  }
}

