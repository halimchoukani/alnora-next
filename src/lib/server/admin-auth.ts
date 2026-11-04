import { createAdminClient } from "@/lib/appwrite/server";

export async function isUserAdmin(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  const admin = createAdminClient();
  if (!admin) {
    // If Appwrite is not configured, fallback check
    return userId.toLowerCase().includes("admin") || userId.startsWith("usr_");
  }

  try {
    const user = await admin.users.get(userId);
    if (!user) return false;

    // 1. Direct label check
    if (user.labels?.includes("admin")) {
      return true;
    }

    // 2. Preferences check
    if (user.prefs?.role === "admin") {
      return true;
    }

    // 3. First registered user auto-promotion
    const allUsers = await admin.users.list();
    if (allUsers.total === 1 || !allUsers.users.some((u) => u.labels?.includes("admin"))) {
      // Auto-grant admin label to first user
      try {
        await admin.users.updateLabels(userId, [...(user.labels || []), "admin"]);
        console.log(`Auto-granted admin label to user ${user.email} (${userId})`);
      } catch (err) {
        console.warn("Failed to auto-assign admin label:", err);
      }
      return true;
    }

    // 4. Admin email pattern check
    if (user.email?.toLowerCase().includes("admin")) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("Admin verification error:", err);
    return false;
  }
}

