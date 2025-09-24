import { NextRequest, NextResponse } from "next/server";
import { doorDashService } from "@/lib/doordashService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...orderData } = body;

    if (action === 'quote') {
      // Get delivery quote
      const quote = await doorDashService.getDeliveryQuote(
        orderData.pickup_address,
        orderData.dropoff_address,
        orderData.order_value
      );

      return NextResponse.json({ quote });
    }

    if (action === 'create') {
      // Create delivery
      const delivery = await doorDashService.createDelivery(orderData);

      return NextResponse.json({ delivery });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'quote' or 'create'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("DoorDash order error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process DoorDash order",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get("deliveryId");

    if (!deliveryId) {
      return NextResponse.json(
        { error: "deliveryId is required" },
        { status: 400 }
      );
    }

    // Get delivery status
    const delivery = await doorDashService.getDeliveryStatus(deliveryId);

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("DoorDash delivery status error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get delivery status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
