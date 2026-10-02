import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { verifyJWT } from '@src/common/middlewares/jwt-verify.middleware';
import RestaurantRoutes from '@src/routes/restaurant/RestaurantRoutes';

const restaurantRouter = Router();

// Routes requiring authentication
restaurantRouter.get(Paths.Restaurants.My, verifyJWT, RestaurantRoutes.getMyRestaurants);
restaurantRouter.post(Paths.Restaurants.Create, verifyJWT, RestaurantRoutes.create);
restaurantRouter.patch(Paths.Restaurants.Update, verifyJWT, RestaurantRoutes.update);
restaurantRouter.delete(Paths.Restaurants.Delete, verifyJWT, RestaurantRoutes.delete);

// Public / Semi-public routes
restaurantRouter.get(Paths.Restaurants.GetById, RestaurantRoutes.getById);

export default restaurantRouter;
