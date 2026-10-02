import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { verifyJWT } from '@src/common/middlewares/jwt-verify.middleware';
import OrderRoutes from '@src/routes/order/OrderRoutes';

const orderRouter = Router();

// All order operations require JWT authentication
orderRouter.use(verifyJWT);

orderRouter.post(Paths.Orders.Create, OrderRoutes.create);
orderRouter.get(Paths.Orders.MyBuyer, OrderRoutes.getBuyerOrders);
orderRouter.get(Paths.Orders.MySeller, OrderRoutes.getSellerOrders);
orderRouter.patch(Paths.Orders.Deliver, OrderRoutes.deliver);
orderRouter.patch(Paths.Orders.Approve, OrderRoutes.approve);
orderRouter.get(Paths.Orders.GetById, OrderRoutes.getById);

export default orderRouter;
