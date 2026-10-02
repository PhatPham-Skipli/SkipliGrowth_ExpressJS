import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import { verifyJWT } from '@src/common/middlewares/jwt-verify.middleware';
import AuthRoutes from '@src/routes/auth/AuthRoutes';

// ----------------------- Add AuthRouter --------------------------------- //

const authRouter = Router();

// Email & Password Authentication
authRouter.post(Paths.Auth.Signup, AuthRoutes.signup);
authRouter.post(Paths.Auth.Signin, AuthRoutes.signin);
authRouter.post(Paths.Auth.Logout, AuthRoutes.logout);

// Authenticated User & Role Management
authRouter.get(Paths.Auth.Me, verifyJWT, AuthRoutes.me);
authRouter.post(Paths.Auth.SwitchRole, verifyJWT, AuthRoutes.switchRole);
authRouter.post(Paths.Auth.AddRole, verifyJWT, AuthRoutes.addRole);

// GitHub OAuth
authRouter.get(Paths.Auth.GithubInit, AuthRoutes.githubInit);
authRouter.post(Paths.Auth.Github, AuthRoutes.github);
authRouter.post(Paths.Auth.GithubLink, verifyJWT, AuthRoutes.linkGithub);
authRouter.post(Paths.Auth.GithubUnlink, verifyJWT, AuthRoutes.unlinkGithub);

export default authRouter;
