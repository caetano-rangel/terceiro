import { loadStripe as _loadStripe } from '@stripe/stripe-js';

let stripePromise: ReturnType<typeof _loadStripe> | null = null;

export function loadStripe() {
  if (!stripePromise) {
    stripePromise = _loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY ?? '');
  }
  return stripePromise;
}