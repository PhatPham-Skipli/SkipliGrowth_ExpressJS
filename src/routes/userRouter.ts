// ----------------------- Add UserRouter --------------------------------- //
import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import UserRoutes from '@src/routes/UserRoutes';

const userRouter = Router();

userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.get(Paths.Users.SearchByEmail, UserRoutes.searchByEmail);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.patch(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);

export default userRouter;
