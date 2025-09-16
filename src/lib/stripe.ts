import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Client-side Stripe instance
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    return import('@stripe/stripe-js').then(({ loadStripe }) => 
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    );
  }
  return null;
};

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethods: ['card', 'apple_pay', 'google_pay'],
  // Platform fee percentage (e.g., 10% = 0.10)
  platformFeePercentage: 0.10,
  // Minimum platform fee in cents
  minimumPlatformFee: 200, // $2.00
};

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  const fee = Math.round(amount * STRIPE_CONFIG.platformFeePercentage);
  return Math.max(fee, STRIPE_CONFIG.minimumPlatformFee);
}

// Calculate total amount including fees
export function calculateTotalAmount(
  foodAmount: number,
  deliveryFee: number,
  serviceFee: number = 0
): number {
  const subtotal = foodAmount + deliveryFee + serviceFee;
  const platformFee = calculatePlatformFee(subtotal);
  return subtotal + platformFee;
}

