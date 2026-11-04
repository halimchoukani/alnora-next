export type Category = "rings" | "bracelets" | "necklaces";

export interface Product {
  id: string;
  slug: string;
  name: string;
  collection: string;
  category: Category;
  price: number;
  image_url: string;
  description: string;
  material: string;
  stock: number;
  is_active: boolean;
  created_at?: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  updated_at?: string;
  created_at?: string;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
  order_items?: OrderItem[];
}

