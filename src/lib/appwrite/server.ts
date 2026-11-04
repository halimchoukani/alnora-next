import { Client, Databases, Users, Storage } from "node-appwrite";
import { appwriteConfig } from "./config";

export function createAdminClient() {
  if (!appwriteConfig.projectId || !appwriteConfig.apiKey) {
    return null;
  }

  const client = new Client();
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey);

  return {
    client,
    databases: new Databases(client),
    users: new Users(client),
    storage: new Storage(client),
  };
}

export function createSessionClient(sessionSecret?: string) {
  if (!appwriteConfig.projectId) {
    return null;
  }

  const client = new Client();
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

  if (sessionSecret) {
    client.setSession(sessionSecret);
  }

  return {
    client,
    databases: new Databases(client),
  };
}

