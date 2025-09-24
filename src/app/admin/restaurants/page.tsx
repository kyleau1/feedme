'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Search, Database, Download } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState({
    lat: '37.7749',
    lng: '-122.4194',
    radius: '5000'
  });

  const handleScrapeMenus = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/scrape-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lng),
          radius: parseInt(location.radius)
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error scraping menus:', error);
      setResult({ error: 'Failed to scrape menus' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopulateSample = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // This would call a separate API endpoint for sample data
      const response = await fetch('/api/populate-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error populating sample data:', error);
      setResult({ error: 'Failed to populate sample data' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Restaurant Data Management</h1>
        <p className="text-muted-foreground">
          Populate your database with real restaurant menus and data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Real Menu Scraping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Real Menu Scraping
            </CardTitle>
            <CardDescription>
              Scrape real restaurant menus from Google Places and Yelp APIs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={location.lat}
                  onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                  placeholder="37.7749"
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={location.lng}
                  onChange={(e) => setLocation({ ...location, lng: e.target.value })}
                  placeholder="-122.4194"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                value={location.radius}
                onChange={(e) => setLocation({ ...location, radius: e.target.value })}
                placeholder="5000"
              />
            </div>

            <Button 
              onClick={handleScrapeMenus} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping Menus...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Scrape Real Menus
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Web Menu Scraping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Web Menu Scraping
            </CardTitle>
            <CardDescription>
              Scrape real menus directly from restaurant websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use our advanced web scraping tool to extract real menus from restaurant websites like Chipotle, McDonald's, and more.
            </p>
            <Link href="/admin/scrape-menus">
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Open Menu Scraper
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sample Data Population */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sample Data
            </CardTitle>
            <CardDescription>
              Populate with sample restaurants for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will add 12 sample restaurants with realistic menus including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 3 Italian restaurants</li>
              <li>• 3 Mexican restaurants</li>
              <li>• 3 Chinese restaurants</li>
              <li>• 3 American restaurants</li>
            </ul>

            <Button 
              onClick={handlePopulateSample} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Populating...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Add Sample Restaurants
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="text-red-600">
                <p className="font-semibold">Error:</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <div className="text-green-600">
                <p className="font-semibold">Success!</p>
                <p>{result.message}</p>
                {result.data && (
                  <div className="mt-2 text-sm">
                    <p>• Successfully processed: {result.data.success} restaurants</p>
                    <p>• Errors: {result.data.errors}</p>
                    <p>• Total found: {result.data.total}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Real Menu Scraping:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Enter coordinates for the area you want to scrape</li>
              <li>Set the radius (in meters) for the search area</li>
              <li>Click "Scrape Real Menus" to start the process</li>
              <li>The system will find restaurants and generate realistic menus</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Sample Data:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Add Sample Restaurants" for quick testing</li>
              <li>This adds 12 pre-configured restaurants with menus</li>
              <li>Perfect for development and testing</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
