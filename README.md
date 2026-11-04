# ALNORA Fine Jewelry — Next.js & Appwrite

A high-jewelry e-commerce application cloned and modernized into **Next.js (App Router)** with **Tailwind CSS v4** and a full backend powered by **Appwrite**.

## Architecture & Features

- **Next.js 16 App Router**: Server and client components, optimized image handling, dynamic routing (`/shop`, `/product/[slug]`, `/cart`, `/account`, `/admin`, `/maison`).
- **Design & Style**: Cormorant Garamond (display) & Jost (sans) typography, warm ivory and espresso luxury palette, luxury action buttons (`btn-luxe`, `btn-outline-luxe`, `eyebrow`), sticky navigation with responsive mobile slide-out drawer.
- **Backend & Appwrite Integration**:
  - **Authentication**: Appwrite Account integration with email/password login, register, and role management.
  - **Catalog & Products**: Appwrite Databases collection `products` with category filtering (`rings`, `bracelets`, `necklaces`), slug lookups, and inventory tracking.
  - **Shopping Bag**: Guest storage in `localStorage` (`alnora-cart-v2`) with automatic merge into Appwrite `cart_items` upon user authentication.
  - **Checkout & Orders**: Atomic order processing decrements inventory, creates order items in `order_items`, and archives order in `orders`.
  - **Store Admin**: Product catalog management (create, update, delete, visibility toggle) and live order status tracker (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
  - **Graceful Fallback**: If Appwrite environment variables are not yet configured, the app runs smoothly with local storage and built-in jewelry seeds.

---

## Appwrite Collections Structure

Database ID: `alnora_db` (or configurable in `.env.local`)

1. **`products`**:
   - `slug` (String, required)
   - `name` (String, required)
   - `collection` (String)
   - `category` (String: `rings` | `bracelets` | `necklaces`)
   - `price` (Float, required)
   - `image_url` (String)
   - `description` (String)
   - `material` (String)
   - `stock` (Integer, required)
   - `is_active` (Boolean, required)

2. **`profiles`**:
   - `full_name` (String)
   - `phone` (String)
   - `address_line` (String)
   - `city` (String)
   - `postal_code` (String)
   - `country` (String)

3. **`cart_items`**:
   - `user_id` (String, required)
   - `product_id` (String, required)
   - `quantity` (Integer, required)

4. **`orders`**:
   - `user_id` (String, required)
   - `status` (String: `pending` | `processing` | `shipped` | `delivered` | `cancelled`)
   - `total` (Float, required)
   - `full_name` (String)
   - `phone` (String)
   - `address_line` (String)
   - `city` (String)
   - `postal_code` (String)
   - `country` (String)

5. **`order_items`**:
   - `order_id` (String, required)
   - `product_id` (String, required)
   - `product_name` (String, required)
   - `unit_price` (Float, required)
   - `quantity` (Integer, required)

---

## Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Appwrite Project ID and Server API Key:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="alnora_db"
APPWRITE_API_KEY="your_secret_api_key"
```

### 2. Initialize Appwrite Collections & Catalog
Run the automated schema and seed script:
```bash
npm run setup:appwrite
```
*(Or click **"Sync Appwrite Schema"** in the Store Admin panel at `/admin`)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
