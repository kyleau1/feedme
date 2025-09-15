import { NextRequest, NextResponse } from 'next/server';
import { doorDashService } from '@/lib/doordashService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (!doorDashService.isConfigured()) {
      return NextResponse.json(
        { error: 'DoorDash service not configured. Please set environment variables.' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'check-config':
        const isConfigured = doorDashService.isConfigured();
        if (!isConfigured) {
          return NextResponse.json({ 
            configured: false,
            message: 'DoorDash service is not configured - missing credentials'
          });
        }
        
        // Try to make a simple test request to verify credentials
        try {
          // Test with a minimal quote request
          const testRequest = {
            external_delivery_id: 'test_' + Date.now(),
            pickup_address: {
              street_address: "123 Test St",
              city: "San Francisco",
              state: "CA",
              zip_code: "94102",
              country: "US"
            },
            dropoff_address: {
              street_address: "456 Test Ave",
              city: "San Francisco",
              state: "CA",
              zip_code: "94103",
              country: "US"
            },
            pickup_phone_number: "+15551234567",
            dropoff_phone_number: "+15559876543",
            pickup_business_name: "Test Restaurant",
            order_value: 10.00,
            currency: "USD",
            items: [{
              name: "Test Item",
              quantity: 1,
              unit_price: 10.00,
              total_price: 10.00
            }]
          };
          
          const quote = await doorDashService.getDeliveryQuote(testRequest);
          return NextResponse.json({ 
            configured: true,
            message: 'DoorDash service is configured and working',
            testQuote: quote
          });
        } catch (testError) {
          return NextResponse.json({ 
            configured: true,
            message: 'DoorDash service is configured but test failed: ' + (testError instanceof Error ? testError.message : 'Unknown error'),
            error: testError instanceof Error ? testError.message : 'Unknown error'
          });
        }

      case 'quote':
        const quote = await doorDashService.getDeliveryQuote(data);
        return NextResponse.json({ quote });

      case 'create':
        const delivery = await doorDashService.createDelivery(data);
        return NextResponse.json({ delivery });

      case 'status':
        const status = await doorDashService.getDeliveryStatus(data.deliveryId);
        return NextResponse.json({ status });

      case 'cancel':
        const cancelResult = await doorDashService.cancelDelivery(data.deliveryId);
        return NextResponse.json({ result: cancelResult });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: check-config, quote, create, status, cancel' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('DoorDash API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'deliveryId parameter is required' },
        { status: 400 }
      );
    }

    if (!doorDashService.isConfigured()) {
      return NextResponse.json(
        { error: 'DoorDash service not configured. Please set environment variables.' },
        { status: 500 }
      );
    }

    const delivery = await doorDashService.getDelivery(deliveryId);
    return NextResponse.json({ delivery });
  } catch (error) {
    console.error('DoorDash API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
