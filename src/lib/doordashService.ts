import axios from 'axios';
import jwt from 'jsonwebtoken';

interface DoorDashConfig {
  developerId: string;
  keyId: string;
  signingSecret: string;
  environment: 'sandbox' | 'production';
}

interface DoorDashRestaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  lat: number;
  lng: number;
  rating: number;
  price_level: number;
  cuisine_types: string[];
  opening_hours: {
    open_now: boolean;
    periods: any[];
  };
  photos: string[];
  menu?: any;
}

interface DoorDashMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  is_customizable: boolean;
  modifiers?: any[];
}

class DoorDashService {
  private config: DoorDashConfig;
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.config = {
      developerId: process.env.DOORDASH_DEVELOPER_ID || '',
      keyId: process.env.DOORDASH_KEY_ID || '',
      signingSecret: process.env.DOORDASH_SIGNING_SECRET || '',
      environment: (process.env.DOORDASH_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };

    this.baseURL = this.config.environment === 'production' 
      ? 'https://api.doordash.com/v2'
      : 'https://api-sandbox.doordash.com/v2';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      // Generate JWT token for DoorDash API
      const data = {
        aud: 'doordash',
        iss: this.config.developerId,
        kid: this.config.keyId,
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        iat: Math.floor(Date.now() / 1000),
      };

      const headers = { 
        algorithm: 'HS256', 
        header: { 'dd-ver': 'DD-JWT-V1' } 
      };

      this.accessToken = jwt.sign(
        data,
        Buffer.from(this.config.signingSecret, 'base64'),
        headers
      );

      return this.accessToken;
    } catch (error) {
      console.error('DoorDash JWT generation failed:', error);
      throw new Error('Failed to generate DoorDash JWT token');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    const token = await this.getAccessToken();
    
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'dd-ver': 'DD-JWT-V1'
      },
      data
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`DoorDash API error (${endpoint}):`, error);
      throw error;
    }
  }

  // Search for restaurants near a location
  // Note: DoorDash API doesn't have a public restaurant search endpoint
  // This is a placeholder for future implementation
  async searchRestaurants(lat: number, lng: number, radius: number = 5000): Promise<DoorDashRestaurant[]> {
    console.log('DoorDash restaurant search not available - using fallback');
    return [];
  }

  // Get restaurant details and menu
  async getRestaurantDetails(merchantId: string): Promise<DoorDashRestaurant | null> {
    try {
      const [merchantResponse, menuResponse] = await Promise.all([
        this.makeRequest(`/merchants/${merchantId}`),
        this.makeRequest(`/merchants/${merchantId}/menu`).catch(() => null)
      ]);

      const merchant = merchantResponse.data;
      const menu = menuResponse?.data;

      return {
        id: merchant.id,
        name: merchant.name,
        address: merchant.address?.street_address || '',
        city: merchant.address?.city || '',
        state: merchant.address?.state || '',
        zip_code: merchant.address?.zip_code || '',
        lat: merchant.address?.lat || 0,
        lng: merchant.address?.lng || 0,
        rating: merchant.rating || 0,
        price_level: merchant.price_range || 0,
        cuisine_types: merchant.cuisine_types || [],
        opening_hours: {
          open_now: merchant.is_open || false,
          periods: merchant.hours || []
        },
        photos: merchant.photos || [],
        menu: menu
      };
    } catch (error) {
      console.error('Error getting DoorDash restaurant details:', error);
      return null;
    }
  }

  // Search restaurants by query
  // Note: DoorDash API doesn't have a public restaurant search endpoint
  async searchRestaurantsByQuery(query: string, lat: number, lng: number): Promise<DoorDashRestaurant[]> {
    console.log('DoorDash restaurant search not available - using fallback');
    return [];
  }

  // Get delivery quote
  async getDeliveryQuote(
    pickupAddress: any,
    dropoffAddress: any,
    orderValue: number
  ) {
    try {
      const response = await this.makeRequest('/delivery_quotes', 'POST', {
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        order_value: orderValue,
        currency: 'USD'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting DoorDash delivery quote:', error);
      throw error;
    }
  }

  // Create delivery
  async createDelivery(deliveryData: any) {
    try {
      const response = await this.makeRequest('/deliveries', 'POST', deliveryData);
      return response.data;
    } catch (error) {
      console.error('Error creating DoorDash delivery:', error);
      throw error;
    }
  }

  // Get delivery status
  async getDeliveryStatus(deliveryId: string) {
    try {
      const response = await this.makeRequest(`/deliveries/${deliveryId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting DoorDash delivery status:', error);
      throw error;
    }
  }
}

export const doorDashService = new DoorDashService();
export type { DoorDashRestaurant, DoorDashMenuItem };