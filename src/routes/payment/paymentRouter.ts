import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { verifyJWT } from '@src/common/middlewares/jwt-verify.middleware';
import PaymentRoutes from '@src/routes/payment/PaymentRoutes';

const paymentRouter = Router();

// Public webhook route (must NOT have verifyJWT)
paymentRouter.post(Paths.Payments.Webhook, PaymentRoutes.webhook);

// Authenticated route for creating Inbuilt Stripe Elements PaymentIntent
paymentRouter.post(
  Paths.Payments.CreateIntent,
  verifyJWT,
  PaymentRoutes.createIntent,
);

// Authenticated route for confirming payment and placing order in progress
paymentRouter.post(
  Paths.Payments.Confirm,
  verifyJWT,
  PaymentRoutes.confirmPayment,
);

export default paymentRouter;
