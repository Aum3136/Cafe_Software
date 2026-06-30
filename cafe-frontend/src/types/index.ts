// ── Menu types ────────────────────────────────────────────────────────────────

export interface CafeInfo {
  id: number;
  name: string;
  logo_url: string | null;
  address: string | null;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: 0 | 1;      // 1 = veg (green dot), 0 = non-veg (red dot)
  sort_order: number;
  isPopular?: boolean;
  "3d_model_url"?: string;
  ingredients?: string[];
}

export interface MenuCategory {
  id: number;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

export interface PublicMenuResponse {
  cafe: CafeInfo;
  menu: MenuCategory[];
}

// ── Cart types ────────────────────────────────────────────────────────────────

export interface CartItem {
  item_id: number;
  name: string;
  price: number;
  quantity: number;
  is_veg: 0 | 1;
  added_by_device?: string;
}

export interface Cart {
  cafeSlug: string;
  items: CartItem[];
}
