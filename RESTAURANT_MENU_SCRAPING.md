# Restaurant Menu Scraping System

This system allows you to populate your database with real restaurant menus and data using multiple approaches.

## 🚀 **Quick Start**

### Option 1: Sample Data (Recommended for Testing)
1. **Visit the admin page**: `http://localhost:3001/admin/restaurants`
2. **Click "Add Sample Restaurants"** to populate with 12 sample restaurants
3. **Includes**: Italian, Mexican, Chinese, and American restaurants with realistic menus

### Option 2: Real Menu Scraping
1. **Get API Keys**:
   - Google Places API key (you already have this)
   - Yelp API key (optional, for enhanced data)
2. **Add to `.env.local`**:
   ```env
   YELP_API_KEY=your_yelp_api_key_here
   ```
3. **Visit admin page** and enter coordinates to scrape real restaurants

### Option 3: Command Line
```bash
# Populate with sample data
npm run populate
```

## 🍽️ **What You Get**

### Sample Restaurants (12 total)
- **3 Italian restaurants** with pasta, pizza, and appetizers
- **3 Mexican restaurants** with tacos, burritos, and enchiladas  
- **3 Chinese restaurants** with noodles, main dishes, and appetizers
- **3 American restaurants** with burgers, sandwiches, and wings

### Real Restaurant Data
- **Restaurant details** from Google Places API
- **Enhanced data** from Yelp API (if configured)
- **Realistic menus** generated based on restaurant type
- **Accurate pricing** based on restaurant rating and location
- **Food images** (placeholder SVGs for now)

## 🛠️ **How It Works**

### Menu Generation Algorithm
1. **Determines cuisine type** from restaurant name and categories
2. **Selects appropriate menu template** (Italian, Mexican, Chinese, American)
3. **Adjusts prices** based on restaurant rating and price level
4. **Generates realistic items** with descriptions, allergens, calories
5. **Creates placeholder images** for each menu item

### Data Sources
- **Google Places API**: Restaurant discovery and basic info
- **Yelp API**: Enhanced details, photos, reviews (optional)
- **Menu Templates**: Realistic menu items for each cuisine type
- **Price Algorithms**: Dynamic pricing based on restaurant quality

## 📊 **Database Schema**

The system populates the `restaurants` table with:
- `place_id`: Unique identifier
- `name`: Restaurant name
- `address`: Full address
- `lat/lng`: Coordinates
- `rating`: Restaurant rating
- `price_level`: Price range (1-4)
- `cuisine_types`: Array of cuisine types
- `menu`: Complete menu structure with categories and items
- `phone`: Phone number
- `website`: Restaurant website
- `opening_hours`: Operating hours
- `photos`: Photo references

## 🎯 **Menu Structure**

Each menu contains:
```json
{
  "categories": [
    {
      "name": "Appetizers",
      "items": [
        {
          "id": "unique_item_id",
          "name": "Item Name",
          "description": "Item description",
          "price": 12.99,
          "category": "Appetizers",
          "is_available": true,
          "is_customizable": false,
          "image_url": "data:image/svg+xml;base64...",
          "allergens": ["dairy", "gluten"],
          "calories": 350,
          "preparation_time": 10
        }
      ]
    }
  ]
}
```

## 🔧 **API Endpoints**

### `/api/scrape-menus` (POST)
Scrapes real restaurants from Google Places and Yelp
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "radius": 5000
}
```

### `/api/populate-sample` (POST)
Populates database with sample restaurants
```json
{
  "success": true,
  "message": "Successfully populated 12 sample restaurants",
  "data": {
    "success": 12,
    "errors": 0,
    "total": 12
  }
}
```

## 🚀 **Next Steps**

1. **Test the system**: Use sample data first
2. **Configure APIs**: Add Yelp API key for enhanced data
3. **Scrape real data**: Use coordinates for your target area
4. **Customize menus**: Modify templates for your needs
5. **Add real images**: Integrate with food image APIs

## 💡 **Tips**

- **Start with sample data** to test your app
- **Use real scraping** for production data
- **Monitor API usage** to avoid rate limits
- **Customize templates** for your market
- **Add more cuisine types** as needed

## 🔍 **Troubleshooting**

### Common Issues
1. **No restaurants found**: Check coordinates and radius
2. **API errors**: Verify API keys are correct
3. **Database errors**: Check Supabase connection
4. **Rate limiting**: Add delays between requests

### Debug Mode
Check browser console and server logs for detailed error messages.

---

**Ready to populate your database with real restaurant menus!** 🍽️
