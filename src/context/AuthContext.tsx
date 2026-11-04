"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getAppwriteClient } from "@/lib/appwrite/client";
import { Profile } from "@/lib/types";
import { ID } from "appwrite";

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  ready: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error?: string }>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LOCAL_USER_KEY = "alnora_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      }
    } catch (err) {
      console.warn("Could not load profile:", err);
    }
  }, []);

  const checkUser = useCallback(async () => {
    const { account, isConfigured } = getAppwriteClient();

    if (isConfigured && account) {
      try {
        const current = await account.get();
        if (current) {
          const authUser: User = {
            id: current.$id,
            email: current.email,
            name: current.name,
          };
          setUser(authUser);
          // Check admin status from Appwrite labels or prefs, and verify with server
          const labels = (current as any).labels || [];
          const prefs = (current as any).prefs || {};
          let isUserAdmin = labels.includes("admin") || prefs.role === "admin" || current.email.includes("admin");
          try {
            const roleRes = await fetch(`/api/auth/role?userId=${encodeURIComponent(current.$id)}`);
            if (roleRes.ok) {
              const roleData = await roleRes.json();
              if (roleData.isAdmin) isUserAdmin = true;
            }
          } catch (e) {
            console.warn("Could not check server role:", e);
          }
          setIsAdmin(isUserAdmin);
          await fetchProfile(current.$id);
          setReady(true);
          return;
        }
      } catch {
        // Not logged in or session expired
      }
    }

    // Check local fallback session
    try {
      const local = localStorage.getItem(LOCAL_USER_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        setUser(parsed);
        setIsAdmin(Boolean(parsed.isAdmin || parsed.email?.includes("admin")));
        await fetchProfile(parsed.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
    }
    setReady(true);
  }, [fetchProfile]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const signIn = async (email: string, pass: string) => {
    const { account, isConfigured } = getAppwriteClient();

    if (isConfigured && account) {
      try {
        await account.createEmailPasswordSession(email, pass);
        await checkUser();
        return {};
      } catch (err: any) {
        return { error: err.message || "Failed to sign in with Appwrite" };
      }
    }

    // Fallback client-side simulated auth
    const mockUser: User & { isAdmin: boolean } = {
      id: `usr_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
      email,
      name: email.split("@")[0],
      isAdmin: email.toLowerCase().includes("admin"),
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAdmin(mockUser.isAdmin);
    await fetchProfile(mockUser.id);
    return {};
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { account, isConfigured } = getAppwriteClient();

    if (isConfigured && account) {
      try {
        await account.create(ID.unique(), email, pass, name);
        await account.createEmailPasswordSession(email, pass);
        // Save initial profile
        const current = await account.get();
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: current.$id, full_name: name }),
        });
        await checkUser();
        return {};
      } catch (err: any) {
        return { error: err.message || "Failed to create account" };
      }
    }

    // Fallback client-side simulated signup
    const mockUser: User & { isAdmin: boolean } = {
      id: `usr_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
      email,
      name,
      isAdmin: email.toLowerCase().includes("admin"),
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAdmin(mockUser.isAdmin);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: mockUser.id, full_name: name }),
    });
    await fetchProfile(mockUser.id);
    return {};
  };

  const signOut = async () => {
    const { account, isConfigured } = getAppwriteClient();
    if (isConfigured && account) {
      try {
        await account.deleteSession("current");
      } catch (e) {
        console.warn("Sign out session delete warning:", e);
      }
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: "Must be signed in" };
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");
      setProfile(result.profile);
      return {};
    } catch (err: any) {
      return { error: err.message || "Failed to update profile" };
    }
  };

  const reloadProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        ready,
        signIn,
        signUp,
        signOut,
        updateProfile,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

