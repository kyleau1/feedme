// Menu Types for FeedMe App
// These types define the structure for restaurant menus and menu items

export interface Restaurant {
  id: string;
  place_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  price_level?: number;
  cuisine_types?: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  is_active: boolean;
  menu_last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface MenuItemModifier {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
  is_required: boolean;
  is_multiple_selection: boolean;
  max_selections: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  currency: string;
  image_url?: string;
  is_available: boolean;
  is_popular: boolean;
  is_spicy: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string[];
  calories?: number;
  preparation_time?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  variants?: MenuItemVariant[];
  modifiers?: MenuItemModifier[];
  category?: MenuCategory;
}

export interface OrderItem {
  id: string; // menu_item_id
  name: string;
  description?: string;
  base_price: number;
  quantity: number;
  selected_variant?: {
    id: string;
    name: string;
    price_modifier: number;
  };
  selected_modifiers?: Array<{
    id: string;
    name: string;
    price_modifier: number;
  }>;
  total_price: number;
  special_instructions?: string;
}

export interface MenuData {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface MenuSearchFilters {
  category_id?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_spicy?: boolean;
  is_popular?: boolean;
  max_price?: number;
  min_price?: number;
  search_query?: string;
}

export interface MenuStats {
  total_items: number;
  total_categories: number;
  available_items: number;
  popular_items: number;
  vegetarian_items: number;
  vegan_items: number;
  average_price: number;
  price_range: {
    min: number;
    max: number;
  };
}
