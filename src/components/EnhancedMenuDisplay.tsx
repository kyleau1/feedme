"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ShoppingCart, Plus, Star, Clock, Leaf, Zap } from "lucide-react";
import { EnhancedMenuItem, ItemCustomization } from "@/lib/enhancedMenuTypes";
import { MenuData, MenuSearchFilters, MenuStats } from "@/lib/menuTypes";
import { EnhancedMenuService } from "@/lib/enhancedMenuService";
import ItemCustomizationComponent from "./ItemCustomization";

interface EnhancedMenuDisplayProps {
  menuData: MenuData;
  onAddToCart: (item: EnhancedMenuItem, customizations: ItemCustomization[], totalPrice: number, quantity: number) => void;
  onSearch: (query: string) => void;
  onFilter: (filters: MenuSearchFilters) => void;
  searchQuery: string;
  filters: MenuSearchFilters;
  stats: MenuStats;
}

export default function EnhancedMenuDisplay({
  menuData,
  onAddToCart,
  onSearch,
  onFilter,
  searchQuery,
  filters,
  stats
}: EnhancedMenuDisplayProps) {
  const [selectedItem, setSelectedItem] = useState<EnhancedMenuItem | null>(null);
  const [enhancedItems, setEnhancedItems] = useState<EnhancedMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    // Enhance all menu items with customization capabilities
    if (menuData) {
      let allItems = [];
      
      // Handle both flat items array and nested categories structure
      // Prioritize categories if items array is empty
      if (menuData.items && Array.isArray(menuData.items) && menuData.items.length > 0) {
        // Flat items array (only if it has items)
        allItems = menuData.items;
      } else if (menuData.categories && Array.isArray(menuData.categories)) {
        // Nested categories structure - flatten all items
        for (let i = 0; i < menuData.categories.length; i++) {
          const category = menuData.categories[i];
          
          if (category.items && Array.isArray(category.items)) {
            allItems = allItems.concat(category.items);
          }
        }
      }
      
      const enhanced = allItems.map((item, index) => {
        return EnhancedMenuService.enhanceMenuItem(item);
      });
      setEnhancedItems(enhanced);
    } else {
      setEnhancedItems([]);
    }
  }, [menuData]);

  const handleItemClick = (item: EnhancedMenuItem) => {
    if (item.is_customizable) {
      setSelectedItem(item);
    } else {
      // For non-customizable items, add directly to cart
      onAddToCart(item, [], item.price, 1);
    }
  };

  const handleCustomize = (customizations: ItemCustomization[], totalPrice: number) => {
    if (selectedItem) {
      onAddToCart(selectedItem, customizations, totalPrice, 1);
      setSelectedItem(null);
    }
  };

  const filteredItems = (enhancedItems || []).filter(item => {
    // Category filter - check both category_id and category name
    if (selectedCategory !== "all") {
      const itemCategory = typeof item.category === 'string' ? item.category : item.category?.name || '';
      const categoryMatch = item.category_id === selectedCategory || itemCategory === selectedCategory;
      if (!categoryMatch) {
        return false;
      }
    }

    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Availability filter - only show available items by default
    if (!item.is_available) {
      return false;
    }

    // Price filter
    if (filters.max_price && item.price > filters.max_price) {
      return false;
    }
    if (filters.min_price && item.price < filters.min_price) {
      return false;
    }

    // Dietary filters
    if (filters.is_vegetarian && !item.is_vegetarian) {
      return false;
    }
    if (filters.is_vegan && !item.is_vegan) {
      return false;
    }
    if (filters.is_gluten_free && !item.is_gluten_free) {
      return false;
    }

    return true;
  });

  const displayItems = filteredItems;

  const getItemPrice = (item: EnhancedMenuItem) => {
    return item.price || 0;
  };

  const getItemImage = (item: EnhancedMenuItem) => {
    return item.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE1MCA4OS41IDE1OC41IDgxIDE2OSA4MUMxNzkuNSA4MSAxODggODkuNSAxODggMTAwQzE4OCAxMTAuNSAxNzkuNSAxMTkgMTY5IDExOUMxNTguNSAxMTkgMTUwIDExMC41IDE1MCAxMDBaIiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0xMjAgMTIwQzEyMCAxMTQuNSAxMjQuNSAxMTAgMTMwIDExMEMxMzUuNSAxMTAgMTQwIDExNC41IDE0MCAxMjBDMTQwIDEyNS41IDEzNS41IDEzMCAxMzAgMTMwQzEyNC41IDEzMCAxMjAgMTI1LjUgMTIwIDEyMFoiIGZpbGw9IiNFNUU3RUIiLz4KPHN0eWxlPgouZm9vZC1pY29uIHsKICBmaWxsOiAjOUNBM0E5OwogIGZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsKICBmb250LXNpemU6IDE0cHg7CiAgZm9udC13ZWlnaHQ6IGJvbGQ7Cn0KPC9zdHlsZT4KPC9zdmc+';
  };

  const getDietaryBadges = (item: EnhancedMenuItem) => {
    const badges = [];
    if (item.is_vegetarian) badges.push({ label: 'Vegetarian', icon: Leaf, color: 'bg-green-100 text-green-800' });
    if (item.is_vegan) badges.push({ label: 'Vegan', icon: Leaf, color: 'bg-green-100 text-green-800' });
    if (item.is_gluten_free) badges.push({ label: 'Gluten Free', icon: Leaf, color: 'bg-blue-100 text-blue-800' });
    if (item.is_spicy) badges.push({ label: 'Spicy', icon: Zap, color: 'bg-red-100 text-red-800' });
    return badges;
  };

  if (selectedItem) {
    return (
      <ItemCustomizationComponent
        item={selectedItem}
        onCustomize={handleCustomize}
        onClose={() => setSelectedItem(null)}
      />
    );
  }

  // Show loading state if menuData is not loaded yet
  if (!menuData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading menu...</h3>
          <p className="text-muted-foreground">
            Please wait while we load the restaurant menu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {menuData.categories.map((category, index) => (
                  <SelectItem key={`${category.name}-${index}`} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.is_vegetarian ? "default" : "outline"}
              size="sm"
              onClick={() => onFilter({ ...filters, is_vegetarian: !filters.is_vegetarian })}
            >
              <Leaf className="h-4 w-4 mr-1" />
              Vegetarian
            </Button>
            <Button
              variant={filters.is_vegan ? "default" : "outline"}
              size="sm"
              onClick={() => onFilter({ ...filters, is_vegan: !filters.is_vegan })}
            >
              <Leaf className="h-4 w-4 mr-1" />
              Vegan
            </Button>
            <Button
              variant={filters.is_gluten_free ? "default" : "outline"}
              size="sm"
              onClick={() => onFilter({ ...filters, is_gluten_free: !filters.is_gluten_free })}
            >
              <Leaf className="h-4 w-4 mr-1" />
              Gluten Free
            </Button>
            <Button
              variant={filters.is_spicy ? "default" : "outline"}
              size="sm"
              onClick={() => onFilter({ ...filters, is_spicy: !filters.is_spicy })}
            >
              <Zap className="h-4 w-4 mr-1" />
              Spicy
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map((item) => {
          const dietaryBadges = getDietaryBadges(item);
          
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={getItemImage(item)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-food.jpg';
                  }}
                />
                {item.is_popular && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge variant="destructive">Unavailable</Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="text-right">
                      <div className="text-lg font-bold">${getItemPrice(item).toFixed(2)}</div>
                      {item.original_price && item.original_price > item.price && (
                        <div className="text-sm text-muted-foreground line-through">
                          ${item.original_price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {dietaryBadges.map((badge, index) => (
                      <Badge key={index} variant="secondary" className={badge.color}>
                        <badge.icon className="h-3 w-3 mr-1" />
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                  
                  {item.calories && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {item.calories} cal
                    </div>
                  )}
                  
                  {item.preparation_time && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {item.preparation_time} min
                    </div>
                  )}
                </div>
                
                <Button
                  className="w-full mt-4"
                  onClick={() => handleItemClick(item)}
                  disabled={!item.is_available}
                >
                  {item.is_customizable ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Customize & Add
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {displayItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
