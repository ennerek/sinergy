import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const PRICES = {
  level2: process.env.STRIPE_PRICE_LEVEL2 ?? 'price_level2',
} as const;
