import jwt from 'jsonwebtoken';

export interface DoorDashCredentials {
  developerId: string;
  keyId: string;
  signingSecret: string;
}

export interface DoorDashDelivery {
  id: string;
  external_delivery_id: string;
  pickup_address: Address;
  dropoff_address: Address;
  pickup_phone_number: string;
  dropoff_phone_number: string;
  pickup_business_name: string;
  pickup_instructions?: string;
  dropoff_instructions?: string;
  pickup_reference_tag?: string;
  dropoff_reference_tag?: string;
  order_value: number;
  currency: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  created_at: string;
  updated_at: string;
  pickup_time?: string;
  dropoff_time?: string;
  tracking_url?: string;
}

export interface Address {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface DeliveryItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type DeliveryStatus = 
  | 'quote' 
  | 'created' 
  | 'accepted' 
  | 'picked_up' 
  | 'delivered' 
  | 'cancelled' 
  | 'expired';

export interface CreateDeliveryRequest {
  external_delivery_id: string;
  pickup_address: Address;
  dropoff_address: Address;
  pickup_phone_number: string;
  dropoff_phone_number: string;
  pickup_business_name: string;
  pickup_instructions?: string;
  dropoff_instructions?: string;
  pickup_reference_tag?: string;
  dropoff_reference_tag?: string;
  order_value: number;
  currency: string;
  items: DeliveryItem[];
  pickup_time?: string;
  dropoff_time?: string;
}

export interface DoorDashQuote {
  external_delivery_id: string;
  fee: number;
  currency: string;
  dropoff_eta: string;
  pickup_eta: string;
  expires_at: string;
}

export class DoorDashService {
  private credentials: DoorDashCredentials;
  private baseUrl: string;
  private isProduction: boolean;

  constructor() {
    this.credentials = {
      developerId: process.env.DOORDASH_DEVELOPER_ID || '',
      keyId: process.env.DOORDASH_KEY_ID || '',
      signingSecret: process.env.DOORDASH_SIGNING_SECRET || '',
    };
    
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isTestMode = process.env.DOORDASH_TEST_MODE === 'true';
    
    // Use sandbox since credentials are for sandbox environment
    this.baseUrl = 'https://openapi-sandbox.doordash.com';
  }

  /**
   * Generate JWT token for DoorDash API authentication
   */
  private generateJWT(): string {
    if (!this.credentials.developerId || !this.credentials.keyId || !this.credentials.signingSecret) {
      throw new Error('DoorDash credentials not configured. Please set DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, and DOORDASH_SIGNING_SECRET environment variables.');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'doordash',
      iss: this.credentials.developerId,
      iat: now,
      exp: now + 1800, // 30 minutes expiration (DoorDash maximum)
      kid: this.credentials.keyId, // Add kid to payload as well
    };

    console.log('Generating JWT with credentials:', {
      developerId: this.credentials.developerId,
      keyId: this.credentials.keyId,
      hasSigningSecret: !!this.credentials.signingSecret
    });

    // Create JWT manually to ensure proper formatting
    const header = {
      'dd-ver': 'DD-JWT-V1',
      kid: this.credentials.keyId,
      typ: 'JWT',
      alg: 'HS256'
    };

    // Decode signing secret from base64 as per DoorDash docs
    const signingSecret = Buffer.from(this.credentials.signingSecret, 'base64');

    // Create JWT manually
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // Create signature using crypto
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', signingSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    console.log('Generated JWT token:', token);
    console.log('JWT Header:', JSON.stringify(header));
    console.log('JWT Payload:', JSON.stringify(payload));
    
    return token;
  }

  /**
   * Make authenticated request to DoorDash API
   */
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    try {
      const token = this.generateJWT();
      const url = `${this.baseUrl}${endpoint}`;

      console.log('DoorDash API Request:', {
        url,
        method,
        hasToken: !!token,
        body: body ? JSON.stringify(body, null, 2) : undefined
      });

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log('DoorDash API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DoorDash API Error Response:', errorText);
        throw new Error(`DoorDash API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('DoorDash API Success:', data);
      return data;
    } catch (error) {
      console.error('DoorDash API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Get a delivery quote
   */
  async getDeliveryQuote(request: CreateDeliveryRequest): Promise<DoorDashQuote> {
    // Convert addresses to comma-separated strings and fix phone numbers
    const cleanRequest = {
      ...request,
      pickup_address: `${request.pickup_address.street_address}, ${request.pickup_address.city}, ${request.pickup_address.state} ${request.pickup_address.zip_code}, ${request.pickup_address.country}`,
      dropoff_address: `${request.dropoff_address.street_address}, ${request.dropoff_address.city}, ${request.dropoff_address.state} ${request.dropoff_address.zip_code}, ${request.dropoff_address.country}`,
      // Use proper US phone number format
      pickup_phone_number: '+14155551234', // San Francisco area code
      dropoff_phone_number: '+14155559876'  // San Francisco area code
    };
    
    return this.makeRequest<DoorDashQuote>('/drive/v2/quotes', 'POST', cleanRequest);
  }

  /**
   * Create a delivery
   */
  async createDelivery(request: CreateDeliveryRequest): Promise<DoorDashDelivery> {
    // Convert addresses to comma-separated strings and fix phone numbers for delivery creation
    const cleanRequest = {
      ...request,
      pickup_address: `${request.pickup_address.street_address}, ${request.pickup_address.city}, ${request.pickup_address.state} ${request.pickup_address.zip_code}, ${request.pickup_address.country}`,
      dropoff_address: `${request.dropoff_address.street_address}, ${request.dropoff_address.city}, ${request.dropoff_address.state} ${request.dropoff_address.zip_code}, ${request.dropoff_address.country}`,
      // Use proper US phone number format
      pickup_phone_number: '+14155551234', // San Francisco area code
      dropoff_phone_number: '+14155559876'  // San Francisco area code
    };
    
    return this.makeRequest<DoorDashDelivery>('/drive/v2/deliveries', 'POST', cleanRequest);
  }

  /**
   * Get delivery details by ID
   */
  async getDelivery(deliveryId: string): Promise<DoorDashDelivery> {
    return this.makeRequest<DoorDashDelivery>(`/drive/v2/deliveries/${deliveryId}`);
  }

  /**
   * Cancel a delivery
   */
  async cancelDelivery(deliveryId: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/drive/v2/deliveries/${deliveryId}/cancel`, 'POST');
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(deliveryId: string): Promise<{ status: DeliveryStatus }> {
    const delivery = await this.getDelivery(deliveryId);
    return { status: delivery.status };
  }

  /**
   * Convert restaurant order to DoorDash delivery request
   */
  convertOrderToDeliveryRequest(
    orderData: {
      restaurantName: string;
      restaurantAddress: Address;
      customerAddress: Address;
      customerPhone: string;
      restaurantPhone: string;
      items: Array<{ name: string; description?: string; quantity: number; unitPrice: number }>;
      orderValue: number;
      externalOrderId: string;
    }
  ): CreateDeliveryRequest {
    const deliveryItems: DeliveryItem[] = orderData.items.map(item => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }));

    return {
      external_delivery_id: orderData.externalOrderId,
      pickup_address: orderData.restaurantAddress,
      dropoff_address: orderData.customerAddress,
      pickup_phone_number: orderData.restaurantPhone,
      dropoff_phone_number: orderData.customerPhone,
      pickup_business_name: orderData.restaurantName,
      pickup_instructions: 'Please call restaurant when arriving for pickup',
      dropoff_instructions: 'Please call customer when arriving for delivery',
      order_value: orderData.orderValue,
      currency: 'USD',
      items: deliveryItems,
    };
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.credentials.developerId && 
      this.credentials.keyId && 
      this.credentials.signingSecret
    );
  }
}

// Export a singleton instance
export const doorDashService = new DoorDashService();
