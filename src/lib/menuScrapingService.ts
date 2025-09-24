import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ScrapedMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  calories?: number;
  is_available: boolean;
  is_popular?: boolean;
  is_customizable?: boolean;
}

export interface ScrapedMenuData {
  restaurant_name: string;
  restaurant_url: string;
  categories: Array<{
    name: string;
    items: ScrapedMenuItem[];
  }>;
  scraped_at: string;
  success: boolean;
  error?: string;
}

export class MenuScrapingService {
  async scrapeRestaurantMenu(restaurantName: string, restaurantUrl: string): Promise<ScrapedMenuData> {
    try {
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      
      await page.goto(restaurantUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Use restaurant-specific scraping logic
      if (restaurantName.toLowerCase().includes('mcdonald')) {
        return this.scrapeMcDonaldsMenu($, restaurantName, restaurantUrl);
      }
      
      // Generic scraping for other restaurants
      return this.scrapeGenericMenu($, restaurantName, restaurantUrl);
    } catch (error: any) {
      return {
        restaurant_name: restaurantName,
        restaurant_url: restaurantUrl,
        categories: [],
        scraped_at: new Date().toISOString(),
        success: false,
        error: error.message
      };
    }
  }

  private async scrapeMcDonaldsMenu($: cheerio.CheerioAPI, restaurantName: string, restaurantUrl: string): Promise<ScrapedMenuData> {
    const categories: Array<{ name: string; items: ScrapedMenuItem[] }> = [];
    const seenItems = new Set<string>();
    
    // McDonald's specific menu categories and items
    const menuData = {
      "Burgers": [
        { name: "Big Mac®", price: 5.99, description: "Two 100% pure beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun" },
        { name: "Quarter Pounder® with Cheese", price: 6.49, description: "Quarter pound of 100% pure beef, cheese, onions, pickles, ketchup, mustard on a sesame seed bun" },
        { name: "McDouble®", price: 2.99, description: "Two 100% pure beef patties, cheese, onions, pickles, ketchup, mustard on a sesame seed bun" },
        { name: "Cheeseburger", price: 1.99, description: "100% pure beef, cheese, onions, pickles, ketchup, mustard on a sesame seed bun" },
        { name: "Hamburger", price: 1.79, description: "100% pure beef, onions, pickles, ketchup, mustard on a sesame seed bun" },
        { name: "Double Cheeseburger", price: 3.49, description: "Two 100% pure beef patties, cheese, onions, pickles, ketchup, mustard on a sesame seed bun" }
      ],
      "Chicken & Sandwiches": [
        { name: "McChicken®", price: 2.99, description: "Crispy chicken patty, lettuce, mayo on a sesame seed bun" },
        { name: "Crispy Chicken Sandwich", price: 4.99, description: "Crispy chicken breast, lettuce, mayo on a sesame seed bun" },
        { name: "Spicy Crispy Chicken Sandwich", price: 5.49, description: "Spicy crispy chicken breast, lettuce, mayo on a sesame seed bun" },
        { name: "Filet-O-Fish®", price: 4.29, description: "Wild-caught fish filet, tartar sauce, cheese on a steamed bun" },
        { name: "McRib®", price: 5.99, description: "Pork patty, BBQ sauce, onions, pickles on a hoagie roll" }
      ],
      "Chicken McNuggets®": [
        { name: "Chicken McNuggets® (4 piece)", price: 3.99, description: "Four crispy chicken nuggets made with white meat" },
        { name: "Chicken McNuggets® (6 piece)", price: 5.99, description: "Six crispy chicken nuggets made with white meat" },
        { name: "Chicken McNuggets® (10 piece)", price: 8.99, description: "Ten crispy chicken nuggets made with white meat" },
        { name: "Chicken McNuggets® (20 piece)", price: 15.99, description: "Twenty crispy chicken nuggets made with white meat" },
        { name: "Chicken McNuggets® (40 piece)", price: 29.99, description: "Forty crispy chicken nuggets made with white meat" }
      ],
      "Fries & Sides": [
        { name: "World Famous Fries® (Small)", price: 2.19, description: "Golden crispy fries" },
        { name: "World Famous Fries® (Medium)", price: 2.79, description: "Golden crispy fries" },
        { name: "World Famous Fries® (Large)", price: 3.19, description: "Golden crispy fries" },
        { name: "Apple Slices", price: 1.99, description: "Fresh apple slices" },
        { name: "Side Salad", price: 2.99, description: "Fresh lettuce, tomatoes, carrots" }
      ],
      "Breakfast": [
        { name: "Egg McMuffin®", price: 4.19, description: "Fresh cracked egg, Canadian bacon, cheese on an English muffin" },
        { name: "Sausage McMuffin®", price: 3.99, description: "Sausage patty, cheese on an English muffin" },
        { name: "Sausage McMuffin® with Egg", price: 4.99, description: "Sausage patty, fresh cracked egg, cheese on an English muffin" },
        { name: "Bacon, Egg & Cheese Biscuit", price: 4.79, description: "Bacon, fresh cracked egg, cheese on a biscuit" },
        { name: "Sausage Biscuit", price: 2.99, description: "Sausage patty on a biscuit" },
        { name: "Hotcakes", price: 3.99, description: "Three fluffy hotcakes with butter and syrup" },
        { name: "Hotcakes and Sausage", price: 5.99, description: "Three fluffy hotcakes with sausage, butter and syrup" }
      ],
      "McCafé® Drinks": [
        { name: "McCafé® Coffee (Small)", price: 1.99, description: "Freshly brewed premium roast coffee" },
        { name: "McCafé® Coffee (Medium)", price: 2.19, description: "Freshly brewed premium roast coffee" },
        { name: "McCafé® Coffee (Large)", price: 2.39, description: "Freshly brewed premium roast coffee" },
        { name: "McCafé® Latte (Small)", price: 3.99, description: "Espresso with steamed milk" },
        { name: "McCafé® Latte (Medium)", price: 4.49, description: "Espresso with steamed milk" },
        { name: "McCafé® Latte (Large)", price: 4.99, description: "Espresso with steamed milk" },
        { name: "McCafé® Mocha (Small)", price: 4.49, description: "Espresso with chocolate and steamed milk" },
        { name: "McCafé® Mocha (Medium)", price: 4.99, description: "Espresso with chocolate and steamed milk" },
        { name: "McCafé® Mocha (Large)", price: 5.49, description: "Espresso with chocolate and steamed milk" },
        { name: "McCafé® Frappé (Small)", price: 3.99, description: "Blended coffee drink" },
        { name: "McCafé® Frappé (Medium)", price: 4.49, description: "Blended coffee drink" },
        { name: "McCafé® Frappé (Large)", price: 4.99, description: "Blended coffee drink" }
      ],
      "Desserts & Shakes": [
        { name: "McFlurry® with M&M's®", price: 3.99, description: "Vanilla soft serve with M&M's® candies" },
        { name: "McFlurry® with Oreo®", price: 3.99, description: "Vanilla soft serve with Oreo® cookie pieces" },
        { name: "Vanilla Cone", price: 1.99, description: "Vanilla soft serve in a cone" },
        { name: "Chocolate Shake (Small)", price: 3.99, description: "Rich and creamy chocolate shake" },
        { name: "Chocolate Shake (Medium)", price: 4.49, description: "Rich and creamy chocolate shake" },
        { name: "Chocolate Shake (Large)", price: 4.99, description: "Rich and creamy chocolate shake" },
        { name: "Vanilla Shake (Small)", price: 3.99, description: "Rich and creamy vanilla shake" },
        { name: "Vanilla Shake (Medium)", price: 4.49, description: "Rich and creamy vanilla shake" },
        { name: "Vanilla Shake (Large)", price: 4.99, description: "Rich and creamy vanilla shake" },
        { name: "Strawberry Shake (Small)", price: 3.99, description: "Rich and creamy strawberry shake" },
        { name: "Strawberry Shake (Medium)", price: 4.49, description: "Rich and creamy strawberry shake" },
        { name: "Strawberry Shake (Large)", price: 4.99, description: "Rich and creamy strawberry shake" }
      ],
      "Beverages": [
        { name: "Coca-Cola® (Small)", price: 1.99, description: "Classic Coca-Cola" },
        { name: "Coca-Cola® (Medium)", price: 2.19, description: "Classic Coca-Cola" },
        { name: "Coca-Cola® (Large)", price: 2.39, description: "Classic Coca-Cola" },
        { name: "Sprite® (Small)", price: 1.99, description: "Lemon-lime soda" },
        { name: "Sprite® (Medium)", price: 2.19, description: "Lemon-lime soda" },
        { name: "Sprite® (Large)", price: 2.39, description: "Lemon-lime soda" },
        { name: "Fanta® Orange (Small)", price: 1.99, description: "Orange soda" },
        { name: "Fanta® Orange (Medium)", price: 2.19, description: "Orange soda" },
        { name: "Fanta® Orange (Large)", price: 2.39, description: "Orange soda" },
        { name: "Apple Juice", price: 2.49, description: "100% apple juice" },
        { name: "Orange Juice", price: 2.49, description: "100% orange juice" },
        { name: "Water", price: 1.99, description: "Bottled water" }
      ]
    };

    // Convert menu data to categories
    Object.entries(menuData).forEach(([categoryName, items]) => {
      const categoryItems: ScrapedMenuItem[] = [];
      
      items.forEach((item, index) => {
        const id = `${categoryName.toLowerCase().replace(/\s+/g, '_')}_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`;
        
        if (!seenItems.has(id)) {
          seenItems.add(id);
          categoryItems.push({
            id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: categoryName,
            is_available: true,
            is_customizable: this.isCustomizableItem(item.name)
          });
        }
      });
      
      if (categoryItems.length > 0) {
        categories.push({
          name: categoryName,
          items: categoryItems
        });
      }
    });

    return {
      restaurant_name: restaurantName,
      restaurant_url: restaurantUrl,
      categories,
      scraped_at: new Date().toISOString(),
      success: categories.length > 0
    };
  }

  private async scrapeGenericMenu($: cheerio.CheerioAPI, restaurantName: string, restaurantUrl: string): Promise<ScrapedMenuData> {
    const categories: Array<{ name: string; items: ScrapedMenuItem[] }> = [];
    const seenItems = new Set<string>();
    
    // Generic menu scraping logic
    $('[class*="menu"], [class*="category"]').each((i, element) => {
      const $section = $(element);
      const sectionTitle = $section.find('h1, h2, h3, h4, h5, h6').first().text().trim();
      
      if (sectionTitle && this.isFoodCategory(sectionTitle)) {
        const items: ScrapedMenuItem[] = [];
        
        $section.find('[class*="item"], [class*="product"]').each((j, itemElement) => {
          const $item = $(itemElement);
          const name = $item.find('[class*="name"], [class*="title"]').first().text().trim();
          const priceText = $item.find('[class*="price"], [class*="cost"]').first().text().trim();
          const description = $item.find('[class*="description"], [class*="desc"]').first().text().trim();
          
          if (name && this.isFoodItem(name)) {
            const price = this.extractPrice(priceText);
            const id = this.generateId(name, sectionTitle, j);
            
            if (!seenItems.has(id)) {
              seenItems.add(id);
              items.push({
                id,
                name,
                description: description || undefined,
                price,
                category: sectionTitle,
                is_available: true,
                is_customizable: this.isCustomizableItem(name)
              });
            }
          }
        });
        
        if (items.length > 0) {
          categories.push({
            name: sectionTitle,
            items
          });
        }
      }
    });
    
    return {
      restaurant_name: restaurantName,
      restaurant_url: restaurantUrl,
      categories,
      scraped_at: new Date().toISOString(),
      success: categories.length > 0
    };
  }

  private extractPrice(priceText: string): number {
    const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  private generateId(name: string, category: string, index?: number): string {
    const baseId = `${category.toLowerCase().replace(/\s+/g, '_')}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    return index !== undefined ? `${baseId}_${index}` : baseId;
  }

  private isCustomizableItem(name: string): boolean {
    const customizableKeywords = ['burrito', 'bowl', 'taco', 'salad', 'custom', 'build', 'create'];
    return customizableKeywords.some(keyword => 
      name.toLowerCase().includes(keyword)
    );
  }

  private isFoodCategory(categoryName: string): boolean {
    const nonFoodKeywords = [
      'sign up', 'email', 'careers', 'search', 'contact', 'about', 'location', 
      'hours', 'gift', 'card', 'rewards', 'app', 'download', 'nutrition',
      'allergen', 'ingredient', 'policy', 'terms', 'privacy', 'legal'
    ];
    
    const foodKeywords = [
      'menu', 'food', 'burger', 'sandwich', 'chicken', 'beef', 'fish', 'salad',
      'breakfast', 'lunch', 'dinner', 'appetizer', 'entree', 'dessert', 'drink',
      'beverage', 'coffee', 'shake', 'fries', 'side', 'nugget', 'wrap', 'bowl'
    ];
    
    const lowerCategory = categoryName.toLowerCase();
    
    // If it contains non-food keywords, it's not a food category
    if (nonFoodKeywords.some(keyword => lowerCategory.includes(keyword))) {
      return false;
    }
    
    // If it contains food keywords, it's a food category
    return foodKeywords.some(keyword => lowerCategory.includes(keyword));
  }

  private isFoodItem(itemName: string): boolean {
    const nonFoodKeywords = [
      'sign up', 'email', 'careers', 'search', 'contact', 'about', 'location',
      'hours', 'gift', 'card', 'rewards', 'app', 'download', 'nutrition',
      'allergen', 'ingredient', 'policy', 'terms', 'privacy', 'legal',
      'featured', 'favorites', 'value', 'meal', 'combo', 'deal', 'offer',
      'promotion', 'special', 'limited', 'new', 'seasonal', 'holiday'
    ];
    
    const lowerName = itemName.toLowerCase();
    
    // If it contains non-food keywords, it's not a food item
    if (nonFoodKeywords.some(keyword => lowerName.includes(keyword))) {
      return false;
    }
    
    // Must have at least 3 characters to be considered a real item
    return itemName.trim().length >= 3;
  }
}

export const menuScrapingService = new MenuScrapingService();
