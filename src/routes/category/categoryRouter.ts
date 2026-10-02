import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import CategoryRoutes from '@src/routes/category/CategoryRoutes';

const categoryRouter = Router();

// Public routes for fetching category feature presets (must be before :id)
categoryRouter.get(Paths.Categories.Features, CategoryRoutes.getFeatures);
categoryRouter.get(
  Paths.Categories.FeaturesByCategory,
  CategoryRoutes.getFeaturesByCategory,
);

// Public routes for fetching categories
categoryRouter.get(Paths.Categories.All, CategoryRoutes.getAll);
categoryRouter.get(Paths.Categories.GetById, CategoryRoutes.getById);

export default categoryRouter;
