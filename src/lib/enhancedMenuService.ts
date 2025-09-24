import { supabase } from './supabaseClient';
import { EnhancedMenuItem, CustomizationStep, ItemCustomization, CHIPOTLE_CUSTOMIZATION_TEMPLATES } from './enhancedMenuTypes';
import { MenuItem } from './menuTypes';

export class EnhancedMenuService {
  // Convert a regular MenuItem to an EnhancedMenuItem with customization
  static enhanceMenuItem(item: any): EnhancedMenuItem {
    // Normalize the item to ensure it has all required fields
    const normalizedItem = {
      id: item.id || '',
      restaurant_id: item.restaurant_id || '',
      category_id: item.category_id || '',
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      original_price: item.original_price,
      currency: item.currency || 'USD',
      image_url: item.image_url,
      is_available: item.is_available !== undefined ? item.is_available : true,
      is_popular: item.is_popular !== undefined ? item.is_popular : false,
      is_spicy: item.is_spicy !== undefined ? item.is_spicy : false,
      is_vegetarian: item.is_vegetarian !== undefined ? item.is_vegetarian : false,
      is_vegan: item.is_vegan !== undefined ? item.is_vegan : false,
      is_gluten_free: item.is_gluten_free !== undefined ? item.is_gluten_free : false,
      allergens: item.allergens || [],
      calories: item.calories,
      preparation_time: item.preparation_time,
      display_order: item.display_order || 0,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      variants: item.variants || [],
      modifiers: item.modifiers || [],
      category: item.category || { name: item.category || '' }
    };

    const enhancedItem: EnhancedMenuItem = {
      ...normalizedItem,
      is_customizable: this.isCustomizableItem(normalizedItem),
      customization_type: this.getCustomizationType(normalizedItem),
      required_choices: this.getRequiredChoices(normalizedItem),
      optional_choices: this.getOptionalChoices(normalizedItem),
      customization_steps: this.buildCustomizationSteps(normalizedItem)
    };

    return enhancedItem;
  }

  // Check if an item should be customizable based on its name/category
  private static isCustomizableItem(item: MenuItem): boolean {
    const customizableKeywords = ['burrito', 'bowl', 'taco', 'salad', 'custom'];
    const itemName = item.name.toLowerCase();
    
    // Handle both string and object category formats
    let categoryName = '';
    if (typeof item.category === 'string') {
      categoryName = item.category.toLowerCase();
    } else if (item.category && typeof item.category === 'object' && 'name' in item.category) {
      categoryName = item.category.name.toLowerCase();
    }
    
    return customizableKeywords.some(keyword => 
      itemName.includes(keyword) || categoryName.includes(keyword)
    );
  }

  // Determine the customization type based on item name
  private static getCustomizationType(item: MenuItem): 'burrito' | 'bowl' | 'taco' | 'salad' | 'custom' | undefined {
    const itemName = item.name.toLowerCase();
    
    if (itemName.includes('burrito')) return 'burrito';
    if (itemName.includes('bowl')) return 'bowl';
    if (itemName.includes('taco')) return 'taco';
    if (itemName.includes('salad')) return 'salad';
    
    return 'custom';
  }

  // Get required choices based on customization type
  private static getRequiredChoices(item: MenuItem) {
    const customizationType = this.getCustomizationType(item);
    
    if (customizationType === 'burrito' || customizationType === 'bowl') {
      return CHIPOTLE_CUSTOMIZATION_TEMPLATES[customizationType]?.required_choices || [];
    }
    
    return [];
  }

  // Get optional choices based on customization type
  private static getOptionalChoices(item: MenuItem) {
    const customizationType = this.getCustomizationType(item);
    
    if (customizationType === 'burrito' || customizationType === 'bowl') {
      return CHIPOTLE_CUSTOMIZATION_TEMPLATES[customizationType]?.optional_choices || [];
    }
    
    return [];
  }

  // Build customization steps for the UI flow
  private static buildCustomizationSteps(item: MenuItem): CustomizationStep[] {
    const requiredChoices = this.getRequiredChoices(item);
    const optionalChoices = this.getOptionalChoices(item);
    
    const steps: CustomizationStep[] = [];
    
    // Add required choices first
    requiredChoices.forEach(choice => {
      steps.push({
        id: choice.id,
        name: choice.name,
        description: choice.description,
        type: 'required',
        options: choice.options,
        min_selections: choice.min_selections,
        max_selections: choice.max_selections,
        current_selections: [],
        display_order: choice.display_order
      });
    });
    
    // Add optional choices
    optionalChoices.forEach(choice => {
      steps.push({
        id: choice.id,
        name: choice.name,
        description: choice.description,
        type: 'optional',
        options: choice.options,
        min_selections: choice.min_selections,
        max_selections: choice.max_selections,
        current_selections: [],
        display_order: choice.display_order
      });
    });
    
    return steps.sort((a, b) => a.display_order - b.display_order);
  }

  // Calculate total price with customizations
  static calculateCustomizedPrice(
    basePrice: number, 
    customizations: ItemCustomization[], 
    quantity: number = 1
  ): number {
    const customizationTotal = customizations.reduce((sum, customization) => {
      return sum + customization.total_modifier;
    }, 0);
    
    return (basePrice + customizationTotal) * quantity;
  }

  // Generate a human-readable customization summary
  static generateCustomizationSummary(customizations: ItemCustomization[]): string {
    return customizations
      .filter(c => c.selected_options.length > 0)
      .map(customization => {
        const options = customization.selected_options
          .map(opt => opt.option_name)
          .join(', ');
        return `${customization.choice_name}: ${options}`;
      })
      .join(' • ');
  }

  // Validate customizations against item requirements
  static validateCustomizations(
    item: EnhancedMenuItem, 
    customizations: ItemCustomization[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!item.is_customizable) {
      return { isValid: true, errors: [] };
    }
    
    // Check required choices
    item.required_choices?.forEach(requiredChoice => {
      const customization = customizations.find(c => c.choice_id === requiredChoice.id);
      
      if (!customization || customization.selected_options.length < requiredChoice.min_selections) {
        errors.push(`${requiredChoice.name} is required`);
      }
      
      if (customization && customization.selected_options.length > requiredChoice.max_selections) {
        errors.push(`${requiredChoice.name} allows maximum ${requiredChoice.max_selections} selections`);
      }
    });
    
    // Check optional choices
    item.optional_choices?.forEach(optionalChoice => {
      const customization = customizations.find(c => c.choice_id === optionalChoice.id);
      
      if (customization) {
        if (customization.selected_options.length < optionalChoice.min_selections) {
          errors.push(`${optionalChoice.name} requires minimum ${optionalChoice.min_selections} selections`);
        }
        
        if (customization.selected_options.length > optionalChoice.max_selections) {
          errors.push(`${optionalChoice.name} allows maximum ${optionalChoice.max_selections} selections`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get popular customization combinations
  static getPopularCombinations(item: EnhancedMenuItem): ItemCustomization[] {
    // This would typically come from analytics data
    // For now, return some example combinations
    if (item.customization_type === 'burrito') {
      return [
        {
          choice_id: 'protein',
          choice_name: 'Protein',
          selected_options: [{ option_id: 'chicken', option_name: 'Chicken', price_modifier: 0 }],
          total_modifier: 0,
          is_required: true
        },
        {
          choice_id: 'rice',
          choice_name: 'Rice',
          selected_options: [{ option_id: 'white_rice', option_name: 'White Rice', price_modifier: 0 }],
          total_modifier: 0,
          is_required: true
        },
        {
          choice_id: 'beans',
          choice_name: 'Beans',
          selected_options: [{ option_id: 'black_beans', option_name: 'Black Beans', price_modifier: 0 }],
          total_modifier: 0,
          is_required: true
        }
      ];
    }
    
    return [];
  }

  // Save customization preferences for a user
  static async saveCustomizationPreferences(
    userId: string, 
    itemId: string, 
    customizations: ItemCustomization[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_customization_preferences')
        .upsert({
          user_id: userId,
          item_id: itemId,
          customizations: customizations,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving customization preferences:', error);
      throw error;
    }
  }

  // Load customization preferences for a user
  static async loadCustomizationPreferences(
    userId: string, 
    itemId: string
  ): Promise<ItemCustomization[]> {
    try {
      const { data, error } = await supabase
        .from('user_customization_preferences')
        .select('customizations')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data?.customizations || [];
    } catch (error) {
      console.error('Error loading customization preferences:', error);
      return [];
    }
  }
}
