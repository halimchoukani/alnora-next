import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/server/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ isAdmin: false });
    }
    const adminStatus = await isUserAdmin(userId);
    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error: any) {
    return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
  }
}

