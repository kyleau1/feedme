const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample cities to populate
const CITIES = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 }
];

// Menu templates for different cuisine types
const MENU_TEMPLATES = {
  italian: {
    categories: ['Appetizers', 'Pasta', 'Pizza', 'Main Courses', 'Desserts'],
    items: {
      'Appetizers': [
        { name: 'Bruschetta', description: 'Grilled bread with tomatoes, garlic, and basil', basePrice: 8.99 },
        { name: 'Antipasto Platter', description: 'Selection of cured meats, cheeses, and vegetables', basePrice: 14.99 },
        { name: 'Calamari Fritti', description: 'Crispy fried squid with marinara sauce', basePrice: 12.99 }
      ],
      'Pasta': [
        { name: 'Spaghetti Carbonara', description: 'Pasta with eggs, cheese, and pancetta', basePrice: 16.99 },
        { name: 'Fettuccine Alfredo', description: 'Creamy pasta with parmesan cheese', basePrice: 15.99 },
        { name: 'Penne Arrabbiata', description: 'Spicy tomato sauce with penne pasta', basePrice: 14.99 }
      ],
      'Pizza': [
        { name: 'Margherita Pizza', description: 'Tomato, mozzarella, and fresh basil', basePrice: 18.99 },
        { name: 'Pepperoni Pizza', description: 'Classic pepperoni with mozzarella', basePrice: 19.99 },
        { name: 'Quattro Stagioni', description: 'Four seasons with artichokes, mushrooms, ham, and olives', basePrice: 22.99 }
      ]
    }
  },
  mexican: {
    categories: ['Appetizers', 'Tacos', 'Burritos', 'Enchiladas', 'Desserts'],
    items: {
      'Appetizers': [
        { name: 'Guacamole', description: 'Fresh avocado dip with chips', basePrice: 7.99 },
        { name: 'Queso Fundido', description: 'Melted cheese with chorizo', basePrice: 9.99 },
        { name: 'Nachos Supreme', description: 'Tortilla chips with beans, cheese, and jalapeños', basePrice: 11.99 }
      ],
      'Tacos': [
        { name: 'Carnitas Tacos', description: 'Slow-cooked pork with onions and cilantro', basePrice: 12.99 },
        { name: 'Fish Tacos', description: 'Beer-battered fish with cabbage slaw', basePrice: 13.99 },
        { name: 'Al Pastor Tacos', description: 'Marinated pork with pineapple', basePrice: 12.99 }
      ],
      'Burritos': [
        { name: 'Chicken Burrito', description: 'Grilled chicken with rice, beans, and cheese', basePrice: 14.99 },
        { name: 'Beef Burrito', description: 'Seasoned beef with rice, beans, and cheese', basePrice: 15.99 },
        { name: 'Veggie Burrito', description: 'Black beans, rice, vegetables, and cheese', basePrice: 13.99 }
      ]
    }
  },
  chinese: {
    categories: ['Appetizers', 'Soups', 'Main Dishes', 'Noodles', 'Desserts'],
    items: {
      'Appetizers': [
        { name: 'Spring Rolls', description: 'Crispy vegetable rolls with sweet and sour sauce', basePrice: 6.99 },
        { name: 'Pot Stickers', description: 'Pan-fried dumplings with soy sauce', basePrice: 8.99 },
        { name: 'Egg Rolls', description: 'Crispy rolls with pork and vegetables', basePrice: 7.99 }
      ],
      'Main Dishes': [
        { name: 'Kung Pao Chicken', description: 'Spicy chicken with peanuts and vegetables', basePrice: 16.99 },
        { name: 'Sweet and Sour Pork', description: 'Battered pork with bell peppers and pineapple', basePrice: 15.99 },
        { name: 'Beef with Broccoli', description: 'Tender beef with fresh broccoli in brown sauce', basePrice: 17.99 }
      ],
      'Noodles': [
        { name: 'Lo Mein', description: 'Soft noodles with vegetables and choice of protein', basePrice: 14.99 },
        { name: 'Chow Mein', description: 'Crispy noodles with vegetables and choice of protein', basePrice: 15.99 }
      ]
    }
  },
  american: {
    categories: ['Appetizers', 'Burgers', 'Sandwiches', 'Salads', 'Desserts'],
    items: {
      'Appetizers': [
        { name: 'Buffalo Wings', description: 'Spicy chicken wings with ranch or blue cheese', basePrice: 10.99 },
        { name: 'Mozzarella Sticks', description: 'Breaded cheese sticks with marinara sauce', basePrice: 8.99 },
        { name: 'Onion Rings', description: 'Crispy beer-battered onion rings', basePrice: 7.99 }
      ],
      'Burgers': [
        { name: 'Classic Cheeseburger', description: 'Beef patty with cheese, lettuce, tomato, and onion', basePrice: 12.99 },
        { name: 'Bacon Burger', description: 'Beef patty with bacon, cheese, and BBQ sauce', basePrice: 14.99 },
        { name: 'Mushroom Swiss Burger', description: 'Beef patty with sautéed mushrooms and Swiss cheese', basePrice: 13.99 }
      ],
      'Sandwiches': [
        { name: 'Club Sandwich', description: 'Turkey, bacon, lettuce, tomato, and mayo', basePrice: 11.99 },
        { name: 'Philly Cheesesteak', description: 'Sliced steak with peppers, onions, and cheese', basePrice: 13.99 }
      ]
    }
  }
};

// Generate realistic menu based on restaurant type
function generateMenu(restaurantName, cuisineType = 'american') {
  const template = MENU_TEMPLATES[cuisineType] || MENU_TEMPLATES.american;
  
  // Adjust prices based on restaurant name (fancier names = higher prices)
  const isFancy = restaurantName.toLowerCase().includes('bistro') || 
                  restaurantName.toLowerCase().includes('grill') ||
                  restaurantName.toLowerCase().includes('restaurant');
  const priceMultiplier = isFancy ? 1.3 : 1.0;
  
  const menu = {
    categories: template.categories.map(category => ({
      name: category,
      items: template.items[category]?.map(item => ({
        id: `${restaurantName.replace(/\s+/g, '_').toLowerCase()}_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: item.name,
        description: item.description,
        price: Math.round(item.basePrice * priceMultiplier * 100) / 100,
        category: category,
        is_available: true,
        is_customizable: Math.random() > 0.7,
        image_url: `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="150" fill="#f0f0f0"/>
            <text x="100" y="75" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
              ${item.name}
            </text>
          </svg>
        `).toString('base64')}`,
        allergens: generateAllergens(item.name),
        calories: Math.floor(Math.random() * 500) + 200,
        preparation_time: Math.floor(Math.random() * 15) + 5
      })) || []
    }))
  };

  return menu;
}

function generateAllergens(itemName) {
  const allergens = [];
  
  if (itemName.toLowerCase().includes('cheese') || itemName.toLowerCase().includes('dairy')) {
    allergens.push('dairy');
  }
  if (itemName.toLowerCase().includes('bread') || itemName.toLowerCase().includes('pasta')) {
    allergens.push('gluten');
  }
  if (itemName.toLowerCase().includes('peanut') || itemName.toLowerCase().includes('nut')) {
    allergens.push('nuts');
  }
  
  return allergens;
}

function determineCuisineType(restaurantName) {
  const name = restaurantName.toLowerCase();
  
  if (name.includes('italian') || name.includes('pizza') || name.includes('pasta')) return 'italian';
  if (name.includes('mexican') || name.includes('taco') || name.includes('burrito')) return 'mexican';
  if (name.includes('chinese') || name.includes('asian') || name.includes('wok')) return 'chinese';
  if (name.includes('burger') || name.includes('grill') || name.includes('american')) return 'american';
  
  return 'american';
}

// Sample restaurant data
const SAMPLE_RESTAURANTS = [
  // Italian restaurants
  { name: 'Mario\'s Italian Bistro', address: '123 Main St', lat: 37.7749, lng: -122.4194, rating: 4.5, price_level: 3 },
  { name: 'Bella Vista Pizzeria', address: '456 Oak Ave', lat: 37.7849, lng: -122.4094, rating: 4.2, price_level: 2 },
  { name: 'Trattoria Romana', address: '789 Pine St', lat: 37.7649, lng: -122.4294, rating: 4.7, price_level: 4 },
  
  // Mexican restaurants
  { name: 'El Mariachi Cantina', address: '321 Mission St', lat: 37.7849, lng: -122.4094, rating: 4.3, price_level: 2 },
  { name: 'Casa de Tacos', address: '654 Valencia St', lat: 37.7549, lng: -122.4194, rating: 4.1, price_level: 1 },
  { name: 'La Cocina Mexicana', address: '987 Castro St', lat: 37.7949, lng: -122.3994, rating: 4.6, price_level: 3 },
  
  // Chinese restaurants
  { name: 'Golden Dragon Restaurant', address: '147 Grant Ave', lat: 37.7649, lng: -122.4094, rating: 4.0, price_level: 2 },
  { name: 'Panda Express', address: '258 Market St', lat: 37.7849, lng: -122.4194, rating: 3.8, price_level: 1 },
  { name: 'Imperial Palace', address: '369 Geary Blvd', lat: 37.7749, lng: -122.4294, rating: 4.4, price_level: 3 },
  
  // American restaurants
  { name: 'The Burger Joint', address: '741 Union St', lat: 37.7549, lng: -122.4094, rating: 4.2, price_level: 2 },
  { name: 'Steakhouse Grill', address: '852 Fillmore St', lat: 37.7849, lng: -122.4294, rating: 4.5, price_level: 4 },
  { name: 'Diner 24/7', address: '963 Divisadero St', lat: 37.7649, lng: -122.4394, rating: 3.9, price_level: 1 }
];

async function populateRestaurants() {
  console.log('Starting restaurant population...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const restaurant of SAMPLE_RESTAURANTS) {
    try {
      const cuisineType = determineCuisineType(restaurant.name);
      const menu = generateMenu(restaurant.name, cuisineType);
      
      const restaurantData = {
        place_id: `sample_${restaurant.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: restaurant.name,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
        rating: restaurant.rating,
        price_level: restaurant.price_level,
        cuisine_types: [cuisineType],
        photos: [],
        is_active: true,
        menu: menu,
        phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        website: `https://${restaurant.name.replace(/\s+/g, '').toLowerCase()}.com`,
        opening_hours: [
          'Monday: 11:00 AM – 10:00 PM',
          'Tuesday: 11:00 AM – 10:00 PM',
          'Wednesday: 11:00 AM – 10:00 PM',
          'Thursday: 11:00 AM – 10:00 PM',
          'Friday: 11:00 AM – 11:00 PM',
          'Saturday: 11:00 AM – 11:00 PM',
          'Sunday: 12:00 PM – 9:00 PM'
        ]
      };
      
      const { error } = await supabase
        .from('restaurants')
        .upsert(restaurantData, { 
          onConflict: 'place_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`Error inserting restaurant ${restaurant.name}:`, error);
        errorCount++;
      } else {
        console.log(`Successfully inserted restaurant: ${restaurant.name}`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`Error processing restaurant ${restaurant.name}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Restaurant population completed. Success: ${successCount}, Errors: ${errorCount}`);
  return { success: successCount, errors: errorCount };
}

// Run the population script
if (require.main === module) {
  populateRestaurants()
    .then(result => {
      console.log('Final result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running population script:', error);
      process.exit(1);
    });
}

module.exports = { populateRestaurants };
