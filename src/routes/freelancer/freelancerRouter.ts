import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { verifyJWT } from '@src/common/middlewares/jwt-verify.middleware';
import FreelancerRoutes from '@src/routes/freelancer/FreelancerRoutes';

const freelancerRouter = Router();

// Routes requiring authentication
freelancerRouter.get(
  Paths.Freelancers.MyProfile,
  verifyJWT,
  FreelancerRoutes.getMyProfile,
);
freelancerRouter.patch(
  Paths.Freelancers.UpdateProfile,
  verifyJWT,
  FreelancerRoutes.updateMyProfile,
);

// Public routes for exploration and search
freelancerRouter.get(
  Paths.Freelancers.SearchBySkill,
  FreelancerRoutes.searchBySkill,
);
freelancerRouter.get(
  Paths.Freelancers.PublicProfile,
  FreelancerRoutes.getPublicProfile,
);

export default freelancerRouter;
