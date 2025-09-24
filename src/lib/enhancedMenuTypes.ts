// Enhanced Menu Types for DoorDash-style customization
// This extends the basic menu types to support complex customization flows

export interface EnhancedMenuItem extends MenuItem {
  is_customizable: boolean;
  customization_type?: 'burrito' | 'bowl' | 'taco' | 'salad' | 'custom';
  required_choices?: RequiredChoice[];
  optional_choices?: OptionalChoice[];
  nutrition_info?: NutritionInfo;
  customization_steps?: CustomizationStep[];
}

export interface RequiredChoice {
  id: string;
  name: string;
  description: string;
  options: ChoiceOption[];
  min_selections: number;
  max_selections: number;
  display_order: number;
}

export interface OptionalChoice {
  id: string;
  name: string;
  description: string;
  options: ChoiceOption[];
  min_selections: number;
  max_selections: number;
  display_order: number;
}

export interface ChoiceOption {
  id: string;
  name: string;
  description: string;
  price_modifier: number;
  image_url?: string;
  is_available: boolean;
  nutrition_info?: NutritionInfo;
  display_order: number;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  allergens?: string[];
}

export interface CustomizationStep {
  id: string;
  name: string;
  description: string;
  type: 'required' | 'optional';
  options: ChoiceOption[];
  min_selections: number;
  max_selections: number;
  current_selections: string[];
  display_order: number;
}

export interface EnhancedOrderItem extends OrderItem {
  customizations: ItemCustomization[];
  customization_summary: string;
  image_url?: string;
}

export interface ItemCustomization {
  choice_id: string;
  choice_name: string;
  selected_options: CustomizationOption[];
  total_modifier: number;
  is_required: boolean;
}

export interface CustomizationOption {
  option_id: string;
  option_name: string;
  price_modifier: number;
  image_url?: string;
}

export interface CustomizationFlow {
  item_id: string;
  item_name: string;
  base_price: number;
  steps: CustomizationStep[];
  current_step: number;
  total_steps: number;
  is_complete: boolean;
  total_price: number;
}

export interface MenuCategoryWithImage extends MenuCategory {
  image_url?: string;
  banner_image?: string;
}

// Chipotle-style customization templates
export const CHIPOTLE_CUSTOMIZATION_TEMPLATES = {
  burrito: {
    required_choices: [
      {
        id: 'protein',
        name: 'Protein',
        description: 'Choose your protein',
        options: [
          { id: 'chicken', name: 'Chicken', price_modifier: 0, image_url: '/images/proteins/chicken.jpg' },
          { id: 'steak', name: 'Steak', price_modifier: 2.50, image_url: '/images/proteins/steak.jpg' },
          { id: 'barbacoa', name: 'Barbacoa', price_modifier: 2.50, image_url: '/images/proteins/barbacoa.jpg' },
          { id: 'carnitas', name: 'Carnitas', price_modifier: 2.50, image_url: '/images/proteins/carnitas.jpg' },
          { id: 'sofritas', name: 'Sofritas', price_modifier: 0, image_url: '/images/proteins/sofritas.jpg' },
        ],
        min_selections: 1,
        max_selections: 1,
        display_order: 1
      },
      {
        id: 'rice',
        name: 'Rice',
        description: 'Choose your rice',
        options: [
          { id: 'white_rice', name: 'White Rice', price_modifier: 0, image_url: '/images/rice/white.jpg' },
          { id: 'brown_rice', name: 'Brown Rice', price_modifier: 0, image_url: '/images/rice/brown.jpg' },
          { id: 'no_rice', name: 'No Rice', price_modifier: 0, image_url: '/images/rice/none.jpg' },
        ],
        min_selections: 1,
        max_selections: 1,
        display_order: 2
      },
      {
        id: 'beans',
        name: 'Beans',
        description: 'Choose your beans',
        options: [
          { id: 'black_beans', name: 'Black Beans', price_modifier: 0, image_url: '/images/beans/black.jpg' },
          { id: 'pinto_beans', name: 'Pinto Beans', price_modifier: 0, image_url: '/images/beans/pinto.jpg' },
          { id: 'no_beans', name: 'No Beans', price_modifier: 0, image_url: '/images/beans/none.jpg' },
        ],
        min_selections: 1,
        max_selections: 1,
        display_order: 3
      }
    ],
    optional_choices: [
      {
        id: 'toppings',
        name: 'Toppings',
        description: 'Add your favorite toppings',
        options: [
          { id: 'guacamole', name: 'Guacamole', price_modifier: 2.25, image_url: '/images/toppings/guac.jpg' },
          { id: 'queso', name: 'Queso', price_modifier: 1.50, image_url: '/images/toppings/queso.jpg' },
          { id: 'sour_cream', name: 'Sour Cream', price_modifier: 0, image_url: '/images/toppings/sour_cream.jpg' },
          { id: 'cheese', name: 'Cheese', price_modifier: 0, image_url: '/images/toppings/cheese.jpg' },
          { id: 'lettuce', name: 'Lettuce', price_modifier: 0, image_url: '/images/toppings/lettuce.jpg' },
          { id: 'tomatoes', name: 'Tomatoes', price_modifier: 0, image_url: '/images/toppings/tomatoes.jpg' },
          { id: 'corn', name: 'Corn', price_modifier: 0, image_url: '/images/toppings/corn.jpg' },
          { id: 'onions', name: 'Onions', price_modifier: 0, image_url: '/images/toppings/onions.jpg' },
        ],
        min_selections: 0,
        max_selections: 8,
        display_order: 4
      },
      {
        id: 'salsas',
        name: 'Salsas',
        description: 'Choose your salsas',
        options: [
          { id: 'mild_salsa', name: 'Mild Salsa', price_modifier: 0, image_url: '/images/salsas/mild.jpg' },
          { id: 'medium_salsa', name: 'Medium Salsa', price_modifier: 0, image_url: '/images/salsas/medium.jpg' },
          { id: 'hot_salsa', name: 'Hot Salsa', price_modifier: 0, image_url: '/images/salsas/hot.jpg' },
          { id: 'corn_salsa', name: 'Corn Salsa', price_modifier: 0, image_url: '/images/salsas/corn.jpg' },
          { id: 'tomato_salsa', name: 'Tomato Salsa', price_modifier: 0, image_url: '/images/salsas/tomato.jpg' },
        ],
        min_selections: 0,
        max_selections: 5,
        display_order: 5
      }
    ]
  },
  bowl: {
    required_choices: [
      {
        id: 'protein',
        name: 'Protein',
        description: 'Choose your protein',
        options: [
          { id: 'chicken', name: 'Chicken', price_modifier: 0, image_url: '/images/proteins/chicken.jpg' },
          { id: 'steak', name: 'Steak', price_modifier: 2.50, image_url: '/images/proteins/steak.jpg' },
          { id: 'barbacoa', name: 'Barbacoa', price_modifier: 2.50, image_url: '/images/proteins/barbacoa.jpg' },
          { id: 'carnitas', name: 'Carnitas', price_modifier: 2.50, image_url: '/images/proteins/carnitas.jpg' },
          { id: 'sofritas', name: 'Sofritas', price_modifier: 0, image_url: '/images/proteins/sofritas.jpg' },
        ],
        min_selections: 1,
        max_selections: 1,
        display_order: 1
      },
      {
        id: 'base',
        name: 'Base',
        description: 'Choose your base',
        options: [
          { id: 'white_rice', name: 'White Rice', price_modifier: 0, image_url: '/images/rice/white.jpg' },
          { id: 'brown_rice', name: 'Brown Rice', price_modifier: 0, image_url: '/images/rice/brown.jpg' },
          { id: 'lettuce', name: 'Lettuce', price_modifier: 0, image_url: '/images/lettuce.jpg' },
          { id: 'no_base', name: 'No Base', price_modifier: 0, image_url: '/images/no_base.jpg' },
        ],
        min_selections: 1,
        max_selections: 1,
        display_order: 2
      }
    ],
    optional_choices: [
      {
        id: 'toppings',
        name: 'Toppings',
        description: 'Add your favorite toppings',
        options: [
          { id: 'guacamole', name: 'Guacamole', price_modifier: 2.25, image_url: '/images/toppings/guac.jpg' },
          { id: 'queso', name: 'Queso', price_modifier: 1.50, image_url: '/images/toppings/queso.jpg' },
          { id: 'sour_cream', name: 'Sour Cream', price_modifier: 0, image_url: '/images/toppings/sour_cream.jpg' },
          { id: 'cheese', name: 'Cheese', price_modifier: 0, image_url: '/images/toppings/cheese.jpg' },
          { id: 'lettuce', name: 'Lettuce', price_modifier: 0, image_url: '/images/toppings/lettuce.jpg' },
          { id: 'tomatoes', name: 'Tomatoes', price_modifier: 0, image_url: '/images/toppings/tomatoes.jpg' },
          { id: 'corn', name: 'Corn', price_modifier: 0, image_url: '/images/toppings/corn.jpg' },
          { id: 'onions', name: 'Onions', price_modifier: 0, image_url: '/images/toppings/onions.jpg' },
        ],
        min_selections: 0,
        max_selections: 8,
        display_order: 3
      }
    ]
  }
};

// Import the base types
import { MenuItem, OrderItem, MenuCategory } from './menuTypes';
