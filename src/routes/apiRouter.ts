import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import authRouter from '@src/routes/auth/authRouter';
import categoryRouter from '@src/routes/category/categoryRouter';
import freelancerRouter from '@src/routes/freelancer/freelancerRouter';
import gigRouter from '@src/routes/gig/gigRouter';
import orderRouter from '@src/routes/order/orderRouter';
import paymentRouter from '@src/routes/payment/paymentRouter';
import restaurantRouter from '@src/routes/restaurant/restaurantRouter';
import userRouter from '@src/routes/userRouter';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// ----------------------- Add UserRouter --------------------------------- //
apiRouter.use(Paths.Users._, userRouter);

// ----------------------- Add AuthRouter --------------------------------- //
apiRouter.use(Paths.Auth._, authRouter);

// ----------------------- Add RestaurantRouter --------------------------- //
apiRouter.use(Paths.Restaurants._, restaurantRouter);

// ----------------------- Add FreelancerRouter --------------------------- //
apiRouter.use(Paths.Freelancers._, freelancerRouter);

// ----------------------- Add CategoryRouter ----------------------------- //
apiRouter.use(Paths.Categories._, categoryRouter);

// ----------------------- Add GigRouter ---------------------------------- //
apiRouter.use(Paths.Gigs._, gigRouter);

// ----------------------- Add OrderRouter -------------------------------- //
apiRouter.use(Paths.Orders._, orderRouter);

// ----------------------- Add PaymentRouter ------------------------------ //
apiRouter.use(Paths.Payments._, paymentRouter);


/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
