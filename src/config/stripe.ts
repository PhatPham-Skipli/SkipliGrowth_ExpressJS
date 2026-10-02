import Stripe from 'stripe';

import EnvVars from '@src/common/constants/env';

const stripeSecretKey =
  EnvVars.Stripe.SecretKey || 'sk_test_placeholder_skipli_key';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET =
  EnvVars.Stripe.WebhookSecret || 'whsec_placeholder_skipli_secret';
