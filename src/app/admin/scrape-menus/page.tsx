'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, CheckCircle, XCircle } from 'lucide-react';

interface ScrapingResult {
  success: boolean;
  data?: {
    restaurant_id: string;
    categories_count: number;
    total_items: number;
    scraped_at: string;
  };
  error?: string;
}

export default function ScrapeMenusPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantUrl, setRestaurantUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);

  const handleScrape = async () => {
    if (!restaurantName || !restaurantUrl) {
      alert('Please enter both restaurant name and URL');
      return;
    }

    setIsScraping(true);
    setResult(null);

    try {
      const response = await fetch('/api/scrape-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantName,
          restaurantUrl,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to scrape menu: ' + (error as Error).message,
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleTestScrape = async () => {
    if (!restaurantName || !restaurantUrl) {
      alert('Please enter both restaurant name and URL');
      return;
    }

    setIsScraping(true);
    setResult(null);

    try {
      const response = await fetch(`/api/scrape-menus?restaurant=${encodeURIComponent(restaurantName)}&url=${encodeURIComponent(restaurantUrl)}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to test scrape: ' + (error as Error).message,
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Menu Scraping</h1>
        <p className="text-muted-foreground">
          Scrape real menus from restaurant websites and add them to the database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraping Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Scrape Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Restaurant Name
              </label>
              <Input
                placeholder="e.g., Chipotle, McDonald's, Subway"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Restaurant URL
              </label>
              <Input
                placeholder="https://www.chipotle.com/menu"
                value={restaurantUrl}
                onChange={(e) => setRestaurantUrl(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTestScrape}
                disabled={isScraping}
                variant="outline"
                className="flex-1"
              >
                {isScraping ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Test Scrape
              </Button>

              <Button
                onClick={handleScrape}
                disabled={isScraping}
                className="flex-1"
              >
                {isScraping ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Scrape & Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : result?.success === false ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : null}
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                  {result.data && (
                    <span className="text-sm text-muted-foreground">
                      {result.data.scraped_at}
                    </span>
                  )}
                </div>

                {result.success && result.data ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Categories:</span>
                        <span className="ml-2">{result.data.categories_count}</span>
                      </div>
                      <div>
                        <span className="font-medium">Total Items:</span>
                        <span className="ml-2">{result.data.total_items}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Restaurant ID:</span>
                      <span className="ml-2 font-mono text-xs">{result.data.restaurant_id}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    <span className="font-medium">Error:</span>
                    <span className="ml-2">{result.error}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Enter restaurant details and click "Test Scrape" or "Scrape & Save" to see results.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Chipotle</h4>
              <p className="text-sm text-muted-foreground">
                Restaurant: Chipotle<br />
                URL: https://www.chipotle.com/menu
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRestaurantName('Chipotle');
                  setRestaurantUrl('https://www.chipotle.com/menu');
                }}
              >
                Use This
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">McDonald's</h4>
              <p className="text-sm text-muted-foreground">
                Restaurant: McDonald's<br />
                URL: https://www.mcdonalds.com/us/en-us/full-menu.html
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRestaurantName('McDonald\'s');
                  setRestaurantUrl('https://www.mcdonalds.com/us/en-us/full-menu.html');
                }}
              >
                Use This
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
