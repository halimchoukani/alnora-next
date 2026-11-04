import { Product, Category } from "./types";

export type { Product, Category };

export const categories: { id: Category; label: string; image: string }[] = [
  { id: "rings", label: "Rings", image: "/assets/ring.jpg" },
  { id: "bracelets", label: "Bracelets", image: "/assets/bracelet.jpg" },
  { id: "necklaces", label: "Necklaces", image: "/assets/necklace.jpg" },
];

const categoryAsset: Record<Category, string> = {
  rings: "/assets/ring.jpg",
  bracelets: "/assets/bracelet.jpg",
  necklaces: "/assets/necklace.jpg",
};

export const defaultProducts: Product[] = [
  {
    id: "solstice-solitaire",
    slug: "solstice-solitaire",
    name: "Solstice Solitaire Ring",
    collection: "Solstice",
    category: "rings",
    price: 4800,
    image_url: "/assets/ring.jpg",
    material: "18K yellow gold, 1.2ct diamond",
    description: "A single brilliant diamond held aloft by four delicate claws — the purest expression of light.",
    stock: 10,
    is_active: true,
  },
  {
    id: "constellation-bangle",
    slug: "constellation-bangle",
    name: "Constellation Bangle",
    collection: "Constellation",
    category: "bracelets",
    price: 3650,
    image_url: "/assets/bracelet.jpg",
    material: "18K yellow gold, diamonds",
    description: "Seven bezel-set diamonds orbit a polished gold band, inspired by the night sky.",
    stock: 10,
    is_active: true,
  },
  {
    id: "verdant-pendant",
    slug: "verdant-pendant",
    name: "Verdant Emerald Pendant",
    collection: "Verdant",
    category: "necklaces",
    price: 5200,
    image_url: "/assets/necklace.jpg",
    material: "18K yellow gold, emerald, diamonds",
    description: "A pear-cut emerald crowned by a diamond leaf, suspended on a fine gold chain.",
    stock: 10,
    is_active: true,
  },
  {
    id: "solstice-band",
    slug: "solstice-band",
    name: "Solstice Eternity Band",
    collection: "Solstice",
    category: "rings",
    price: 2900,
    image_url: "/assets/ring.jpg",
    material: "18K yellow gold, diamonds",
    description: "A refined band that catches light from every angle.",
    stock: 10,
    is_active: true,
  },
  {
    id: "constellation-cuff",
    slug: "constellation-cuff",
    name: "Constellation Cuff",
    collection: "Constellation",
    category: "bracelets",
    price: 4100,
    image_url: "/assets/bracelet.jpg",
    material: "18K yellow gold",
    description: "A sculpted cuff with a hidden clasp and timeless silhouette.",
    stock: 10,
    is_active: true,
  },
  {
    id: "verdant-drop",
    slug: "verdant-drop",
    name: "Verdant Drop Necklace",
    collection: "Verdant",
    category: "necklaces",
    price: 6800,
    image_url: "/assets/necklace.jpg",
    material: "18K yellow gold, emerald",
    description: "An heirloom piece, crafted to be passed from one generation to the next.",
    stock: 10,
    is_active: true,
  },
];

export const getAppwriteStorageFileUrl = (fileId: string) => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "6aeb83760009771b8d69";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
};

export const productImage = (p: Pick<Product, "image_url" | "category">) => {
  if (!p) return "/assets/ring.jpg";
  const url = p.image_url;
  if (!url) return categoryAsset[p.category] || "/assets/ring.jpg";

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  if (url.startsWith("asset:")) {
    const key = url.slice(6);
    return `/assets/${key}.jpg`;
  }
  // Raw Appwrite Storage File ID
  if (/^[a-zA-Z0-9_-]{15,36}$/.test(url)) {
    return getAppwriteStorageFileUrl(url);
  }
  return url;
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
