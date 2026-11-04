import { Client, Account, Databases, Storage } from "appwrite";
import { appwriteConfig } from "./config";

let client: Client | null = null;
let account: Account | null = null;
let databases: Databases | null = null;
let storage: Storage | null = null;

if (typeof window !== "undefined" && appwriteConfig.projectId) {
  client = new Client();
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

  account = new Account(client);
  databases = new Databases(client);
  storage = new Storage(client);
}

export { client, account, databases, storage };

export function getAppwriteClient() {
  if (!client && appwriteConfig.projectId) {
    client = new Client();
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);
    account = new Account(client);
    databases = new Databases(client);
    storage = new Storage(client);
  }
  return { client, account, databases, storage, isConfigured: Boolean(client && appwriteConfig.projectId) };
}

