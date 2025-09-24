import { supabase } from './supabaseClient';
import { 
  Restaurant, 
  MenuCategory, 
  MenuItem, 
  MenuData, 
  MenuSearchFilters, 
  MenuStats,
  OrderItem 
} from './menuTypes';

export class MenuService {
  /**
   * Get complete menu data for a restaurant
   */
  async getRestaurantMenu(restaurantId: string): Promise<MenuData | null> {
    try {
      // Get restaurant info
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single();

      if (restaurantError || !restaurant) {
        console.error('Error fetching restaurant:', restaurantError);
        return null;
      }

      // Get menu categories
      const { data: categories, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return null;
      }

      // Get menu items with variants and modifiers
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          variants:menu_item_variants(*),
          modifiers:menu_item_modifiers(*),
          category:menu_categories(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('display_order');

      if (itemsError) {
        console.error('Error fetching menu items:', itemsError);
        return null;
      }

      return {
        restaurant,
        categories: categories || [],
        items: items || []
      };
    } catch (error) {
      console.error('Error in getRestaurantMenu:', error);
      return null;
    }
  }

  /**
   * Get menu data by Google Places ID
   */
  async getMenuByPlaceId(placeId: string): Promise<MenuData | null> {
    try {
      // First try to find by exact place_id match
      const { data: exactMatch, error: exactError } = await supabase
        .from('restaurants')
        .select('id, menu')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .single();

      if (!exactError && exactMatch && exactMatch.menu) {
        // Transform the menu data to match the expected structure
        const menu = exactMatch.menu as any;
        const transformedMenu: MenuData = {
          restaurant: {
            id: exactMatch.id,
            place_id: placeId,
            name: '', // Will be filled by the calling code
            is_active: true,
            created_at: '',
            updated_at: ''
          },
          categories: menu.categories || [],
          items: []
        };
        
        // Flatten items from categories
        if (menu.categories && Array.isArray(menu.categories)) {
          for (const category of menu.categories) {
            if (category.items && Array.isArray(category.items)) {
              transformedMenu.items.push(...category.items);
            }
          }
        }
        
        return transformedMenu;
      }

      // If no exact match, try to find by name similarity
      // This helps when Google Places returns different place_ids than our sample data
      const { data: nameMatches, error: nameError } = await supabase
        .from('restaurants')
        .select('id, name, menu')
        .eq('is_active', true)
        .ilike('name', `%${placeId}%`);

      if (!nameError && nameMatches && nameMatches.length > 0) {
        // Return the first restaurant that has menu data
        for (const restaurant of nameMatches) {
          if (restaurant.menu) {
            const menu = restaurant.menu as any;
            if (menu.categories && Array.isArray(menu.categories)) {
              // Check if any category has items
              let hasItems = false;
              for (const category of menu.categories) {
                if (category.items && Array.isArray(category.items) && category.items.length > 0) {
                  hasItems = true;
                  break;
                }
              }
              
              if (hasItems) {
                // Transform the menu data to match the expected structure
                const transformedMenu: MenuData = {
                  restaurant: {
                    id: restaurant.id,
                    place_id: placeId,
                    name: restaurant.name || '',
                    is_active: true,
                    created_at: '',
                    updated_at: ''
                  },
                  categories: menu.categories || [],
                  items: []
                };
                
                // Flatten items from categories
                for (const category of menu.categories) {
                  if (category.items && Array.isArray(category.items)) {
                    transformedMenu.items.push(...category.items);
                  }
                }
                
                return transformedMenu;
              }
            }
          }
        }
      }

      console.error('Restaurant not found for place_id:', placeId);
      return null;
    } catch (error) {
      console.error('Error in getMenuByPlaceId:', error);
      return null;
    }
  }

  /**
   * Search menu items with filters
   */
  async searchMenuItems(restaurantId: string, filters: MenuSearchFilters = {}): Promise<MenuItem[]> {
    try {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          variants:menu_item_variants(*),
          modifiers:menu_item_modifiers(*),
          category:menu_categories(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true);

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.is_vegetarian !== undefined) {
        query = query.eq('is_vegetarian', filters.is_vegetarian);
      }
      if (filters.is_vegan !== undefined) {
        query = query.eq('is_vegan', filters.is_vegan);
      }
      if (filters.is_gluten_free !== undefined) {
        query = query.eq('is_gluten_free', filters.is_gluten_free);
      }
      if (filters.is_spicy !== undefined) {
        query = query.eq('is_spicy', filters.is_spicy);
      }
      if (filters.is_popular !== undefined) {
        query = query.eq('is_popular', filters.is_popular);
      }
      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }
      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }
      if (filters.search_query) {
        query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
      }

      const { data: items, error } = await query.order('display_order');

      if (error) {
        console.error('Error searching menu items:', error);
        return [];
      }

      return items || [];
    } catch (error) {
      console.error('Error in searchMenuItems:', error);
      return [];
    }
  }

  /**
   * Get menu statistics
   */
  async getMenuStats(restaurantId: string): Promise<MenuStats | null> {
    try {
      const { data: items, error } = await supabase
        .from('menu_items')
        .select('price, is_available, is_popular, is_vegetarian, is_vegan')
        .eq('restaurant_id', restaurantId);

      if (error || !items) {
        console.error('Error fetching menu stats:', error);
        return null;
      }

      const availableItems = items.filter(item => item.is_available);
      const prices = availableItems.map(item => item.price);
      
      return {
        total_items: items.length,
        total_categories: 0, // Will be calculated separately
        available_items: availableItems.length,
        popular_items: availableItems.filter(item => item.is_popular).length,
        vegetarian_items: availableItems.filter(item => item.is_vegetarian).length,
        vegan_items: availableItems.filter(item => item.is_vegan).length,
        average_price: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        price_range: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0
        }
      };
    } catch (error) {
      console.error('Error in getMenuStats:', error);
      return null;
    }
  }

  /**
   * Calculate total price for order items
   */
  calculateOrderTotal(orderItems: OrderItem[]): number {
    return orderItems.reduce((total, item) => {
      let itemTotal = item.base_price;
      
      // Add variant price modifier
      if (item.selected_variant) {
        itemTotal += item.selected_variant.price_modifier;
      }
      
      // Add modifiers price modifiers
      if (item.selected_modifiers) {
        itemTotal += item.selected_modifiers.reduce((modTotal, modifier) => 
          modTotal + modifier.price_modifier, 0);
      }
      
      return total + (itemTotal * item.quantity);
    }, 0);
  }

  /**
   * Validate order items
   */
  validateOrderItems(orderItems: OrderItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const item of orderItems) {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.name}`);
      }
      if (item.base_price < 0) {
        errors.push(`Invalid price for ${item.name}`);
      }
      if (!item.name.trim()) {
        errors.push('Item name is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get popular menu items
   */
  async getPopularItems(restaurantId: string, limit: number = 10): Promise<MenuItem[]> {
    try {
      const { data: items, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          variants:menu_item_variants(*),
          modifiers:menu_item_modifiers(*),
          category:menu_categories(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .eq('is_popular', true)
        .order('display_order')
        .limit(limit);

      if (error) {
        console.error('Error fetching popular items:', error);
        return [];
      }

      return items || [];
    } catch (error) {
      console.error('Error in getPopularItems:', error);
      return [];
    }
  }

  /**
   * Check if restaurant has menu data
   */
  async hasMenuData(placeId: string): Promise<boolean> {
    try {
      // First try to find by exact place_id match
      const { data: exactMatch, error: exactError } = await supabase
        .from('restaurants')
        .select('id, menu')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .single();

      if (!exactError && exactMatch && exactMatch.menu) {
        // Check if menu has items
        const menu = exactMatch.menu as any;
        if (menu.categories && Array.isArray(menu.categories)) {
          // Check if any category has items
          for (const category of menu.categories) {
            if (category.items && Array.isArray(category.items) && category.items.length > 0) {
              return true;
            }
          }
        }
      }

      // If no exact match, try to find by name similarity
      // This helps when Google Places returns different place_ids than our sample data
      const { data: nameMatches, error: nameError } = await supabase
        .from('restaurants')
        .select('id, name, menu')
        .eq('is_active', true)
        .ilike('name', `%${placeId}%`);

      if (!nameError && nameMatches && nameMatches.length > 0) {
        // Check if any of the name matches have menu data
        for (const restaurant of nameMatches) {
          if (restaurant.menu) {
            const menu = restaurant.menu as any;
            if (menu.categories && Array.isArray(menu.categories)) {
              // Check if any category has items
              for (const category of menu.categories) {
                if (category.items && Array.isArray(category.items) && category.items.length > 0) {
                  return true;
                }
              }
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking menu data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const menuService = new MenuService();
