import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { verifyJWT } from '@src/common/middlewares/jwt-verify.middleware';
import GigRoutes from '@src/routes/gig/GigRoutes';

const gigRouter = Router();

// Public routes
gigRouter.get(Paths.Gigs.All, GigRoutes.list);

// Authenticated routes (placed before parameter routes)
gigRouter.get(Paths.Gigs.MyList, verifyJWT, GigRoutes.getMyGigs);
gigRouter.post(Paths.Gigs.Create, verifyJWT, GigRoutes.create);
gigRouter.put(Paths.Gigs.Update, verifyJWT, GigRoutes.update);
gigRouter.delete(Paths.Gigs.Delete, verifyJWT, GigRoutes.delete);

// Parameter lookup route
gigRouter.get(Paths.Gigs.GetByIdOrSlug, GigRoutes.getByIdOrSlug);

export default gigRouter;
