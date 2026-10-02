import { exchangeWebFlowCode } from '@octokit/oauth-methods';
import { Octokit } from 'octokit';

import EnvVars from '@src/common/constants/env';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@src/common/exceptions/api.exception';
import { comparePassword, hashPassword } from '@src/common/utils/password';
import {
  IFreelancerProfile,
} from '@src/models/FreelancerProfile.model';
import RestaurantModel, { IRestaurant } from '@src/models/Restaurant.model';
import UserModel, {
  IPublicUser,
  UserRole,
} from '@src/models/User.model';
import FreelancerProfileRepo from '@src/repos/FreelancerProfileRepo';
import RestaurantRepo from '@src/repos/RestaurantRepo';
import UserRepo from '@src/repos/UserRepo';
import JwtService from '@src/services/JwtService';

/******************************************************************************
                                 Constants
******************************************************************************/

const Errors = {
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  GITHUB_AUTH_FAILED: 'Failed to authenticate with GitHub',
  GITHUB_EMAIL_NOT_FOUND: 'GitHub primary email not found',
} as const;

/******************************************************************************
                                   Types
******************************************************************************/

export interface ISignupDto {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  // Restaurant Owner fields
  restaurantName?: string;
  restaurantType?: string;
  restaurantCity?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  restaurantWebsiteUrl?: string;
  restaurantDescription?: string;
  // Freelancer fields
  professionalTitle?: string;
  skills?: string[];
  hourlyRate?: number;
  location?: string;
  languages?: string[];
}

export interface ISigninDto {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: IPublicUser;
  accessToken: string;
  restaurants?: IRestaurant[];
  freelancerProfile?: IFreelancerProfile | null;
}

export interface IMeResponse {
  user: IPublicUser;
  restaurants: IRestaurant[];
  freelancerProfile: IFreelancerProfile | null;
}

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Signup process: Creates a user document with hashed password in Firestore,
 * and initializes restaurant or freelancer profile in separate collections.
 */
async function signup(dto: ISignupDto): Promise<IAuthResponse> {
  const { email, password, name, role = 'RESTAURANT_OWNER' } = dto;

  if (!password || password.length < 6) {
    throw new BadRequestException(Errors.PASSWORD_TOO_SHORT);
  }

  // 1. Check if user already exists in Firestore
  const existingUser = await UserRepo.getOne(email);
  if (existingUser) {
    throw new BadRequestException(Errors.EMAIL_ALREADY_EXISTS);
  }

  // 2. Hash password
  const passwordHash = await hashPassword(password);

  // 3. Create unique user document in 'users' collection
  const userId = UserRepo.newId();
  const newUser = UserModel.new({
    id: userId,
    email,
    passwordHash,
    name: name || '',
    avatarUrl: dto.avatarUrl || '',
    bio: dto.bio || '',
    phone: dto.phone || dto.restaurantPhone || '',
    roles: [role],
    activeRole: role,
  });
  await UserRepo.add(newUser);

  // 4. Create separate profile based on initial role
  let createdRestaurants: IRestaurant[] = [];
  let createdFreelancerProfile: IFreelancerProfile | null = null;

  if (role === 'RESTAURANT_OWNER' && dto.restaurantName) {
    const newRestaurant = RestaurantModel.new({
      ownerId: newUser.id,
      name: dto.restaurantName,
      type: dto.restaurantType || 'General Dining',
      city: dto.restaurantCity || '',
      address: dto.restaurantAddress || '',
      phone: dto.restaurantPhone || dto.phone || '',
      websiteUrl: dto.restaurantWebsiteUrl || '',
      description: dto.restaurantDescription || dto.bio || '',
    });
    await RestaurantRepo.add(newRestaurant);
    createdRestaurants = [newRestaurant];
  } else if (role === 'FREELANCER') {
    createdFreelancerProfile = await FreelancerProfileRepo.createOrUpdate({
      userId: newUser.id,
      professionalTitle:
        dto.professionalTitle || 'Hospitality Freelancer',
      bio: dto.bio || '',
      skills: dto.skills || [],
      hourlyRate: dto.hourlyRate || 0,
      location: dto.location || dto.restaurantCity || '',
      languages: dto.languages || ['English'],
    });
  }

  // 5. Generate JWT token
  const accessToken = await JwtService.signAccessToken(newUser.id);
  const publicUser = UserModel.toPublic(newUser);

  return {
    user: publicUser,
    accessToken,
    restaurants: createdRestaurants,
    freelancerProfile: createdFreelancerProfile,
  };
}

/**
 * Signin process: Authenticates credentials directly against Firestore passwordHash,
 * and loads user with linked restaurant/freelancer profiles.
 */
async function signin(dto: ISigninDto): Promise<IAuthResponse> {
  const { email, password } = dto;

  // 1. Retrieve user document from Firestore
  const user = await UserRepo.getOne(email);
  if (!user || !user.passwordHash) {
    throw new BadRequestException(Errors.INVALID_CREDENTIALS);
  }

  // 2. Verify password with bcrypt
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new BadRequestException(Errors.INVALID_CREDENTIALS);
  }

  // Check if user is banned
  if (user.isBanned) {
    throw new ForbiddenException(
      user.banReason || 'Your account has been suspended or banned. Please contact support.',
    );
  }

  // 3. Load associated role data
  const [restaurants, freelancerProfile] = await Promise.all([
    RestaurantRepo.getByOwnerId(user.id),
    FreelancerProfileRepo.getByUserId(user.id),
  ]);

  const accessToken = await JwtService.signAccessToken(user.id);
  const publicUser = UserModel.toPublic(user);

  return {
    user: publicUser,
    accessToken,
    restaurants,
    freelancerProfile,
  };
}

/**
 * Get comprehensive current user info including linked restaurants and freelancer profile.
 */
async function getMe(userId: string): Promise<IMeResponse> {
  const user = await UserRepo.getById(userId);
  if (!user) {
    throw new NotFoundException(Errors.USER_NOT_FOUND);
  }

  const [restaurants, freelancerProfile] = await Promise.all([
    RestaurantRepo.getByOwnerId(user.id),
    FreelancerProfileRepo.getByUserId(user.id),
  ]);

  return {
    user: UserModel.toPublic(user),
    restaurants,
    freelancerProfile,
  };
}

/**
 * Switch active role between RESTAURANT_OWNER and FREELANCER.
 */
async function switchRole(
  userId: string,
  targetRole: UserRole,
): Promise<IPublicUser> {
  const user = await UserRepo.getById(userId);
  if (!user) {
    throw new NotFoundException(Errors.USER_NOT_FOUND);
  }

  if (!user.roles.includes(targetRole)) {
    throw new BadRequestException(
      `You do not have the ${targetRole} role. Please activate or add this role first.`,
    );
  }

  const updatedUser = await UserRepo.update({
    id: user.id,
    activeRole: targetRole,
  });

  return UserModel.toPublic(updatedUser);
}

/**
 * Add a second role to the user account and initialize corresponding profile.
 */
async function addRole(
  userId: string,
  newRole: UserRole,
  details?: {
    restaurantName?: string;
    restaurantType?: string;
    restaurantCity?: string;
    restaurantAddress?: string;
    restaurantPhone?: string;
    restaurantWebsiteUrl?: string;
    restaurantDescription?: string;
    professionalTitle?: string;
    bio?: string;
    skills?: string[];
    hourlyRate?: number;
    location?: string;
    languages?: string[];
  },
): Promise<IMeResponse> {
  const user = await UserRepo.getById(userId);
  if (!user) {
    throw new NotFoundException(Errors.USER_NOT_FOUND);
  }

  const updatedRoles = Array.from(new Set([...user.roles, newRole]));
  const updatedUser = await UserRepo.update({
    id: user.id,
    roles: updatedRoles,
    activeRole: newRole,
  });

  // Create role-specific record if details provided
  if (newRole === 'RESTAURANT_OWNER' && details?.restaurantName) {
    await RestaurantRepo.add(
      RestaurantModel.new({
        ownerId: user.id,
        name: details.restaurantName,
        type: details.restaurantType || 'General Dining',
        city: details.restaurantCity || '',
        address: details.restaurantAddress || '',
        phone: details.restaurantPhone || '',
        websiteUrl: details.restaurantWebsiteUrl || '',
        description: details.restaurantDescription || '',
      }),
    );
  } else if (newRole === 'FREELANCER') {
    await FreelancerProfileRepo.createOrUpdate({
      userId: user.id,
      professionalTitle:
        details?.professionalTitle || 'Hospitality Freelancer',
      bio: details?.bio || '',
      skills: details?.skills || [],
      hourlyRate: details?.hourlyRate || 0,
      location: details?.location || '',
      languages: details?.languages || ['English'],
    });
  }

  return getMe(updatedUser.id);
}

/**
 * Github OAuth methods preserved for compatibility
 */
function getGithubAuthUrl(): string {
  const clientId = EnvVars.GithubClientId;
  const redirectUri = EnvVars.GithubRedirectUri;
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email,repo`;
}

async function authWithGithub(code: string): Promise<IAuthResponse> {
  let githubAccessToken: string;
  try {
    const { data } = await exchangeWebFlowCode({
      clientType: 'oauth-app',
      clientId: EnvVars.GithubClientId,
      clientSecret: EnvVars.GithubClientSecret,
      code,
      redirectUrl: EnvVars.GithubRedirectUri,
    });
    githubAccessToken = data.access_token;
  } catch {
    throw new BadRequestException(Errors.GITHUB_AUTH_FAILED);
  }
  const octokit = new Octokit({ auth: githubAccessToken });

  const { data: userData } = await octokit.rest.users.getAuthenticated();
  const githubUsername = userData.login;
  const avatarUrl = userData.avatar_url;

  const { data: emailsData } =
    await octokit.rest.users.listEmailsForAuthenticatedUser();
  const primaryEmailObj = emailsData.find((e) => e.primary);

  if (!primaryEmailObj) {
    throw new BadRequestException(Errors.GITHUB_EMAIL_NOT_FOUND);
  }

  const email = primaryEmailObj.email;

  let existedUser = await UserRepo.getOne(email);
  if (existedUser) {
    if (existedUser.isBanned) {
      throw new ForbiddenException(
        existedUser.banReason || 'Your account has been suspended or banned. Please contact support.',
      );
    }
    existedUser = await UserRepo.update({
      id: existedUser.id,
      githubAccessToken,
      githubUsername,
      avatarUrl: existedUser.avatarUrl || avatarUrl,
    });
  } else {
    const newUser = UserModel.new({
      id: UserRepo.newId(),
      email,
      name: userData.name || githubUsername,
      githubAccessToken,
      githubUsername,
      avatarUrl,
      roles: ['RESTAURANT_OWNER'],
      activeRole: 'RESTAURANT_OWNER',
    });
    await UserRepo.add(newUser);
    existedUser = newUser;
  }

  const [restaurants, freelancerProfile] = await Promise.all([
    RestaurantRepo.getByOwnerId(existedUser.id),
    FreelancerProfileRepo.getByUserId(existedUser.id),
  ]);

  const publicUser = UserModel.toPublic(existedUser);
  const accessToken = await JwtService.signAccessToken(existedUser.id);

  return {
    user: publicUser,
    accessToken,
    restaurants,
    freelancerProfile,
  };
}

async function linkGithub(
  userId: string,
  code: string,
): Promise<IPublicUser> {
  const existedUser = await UserRepo.getById(userId);
  if (!existedUser) {
    throw new NotFoundException(Errors.USER_NOT_FOUND);
  }

  let githubAccessToken: string;
  try {
    const { data } = await exchangeWebFlowCode({
      clientType: 'oauth-app',
      clientId: EnvVars.GithubClientId,
      clientSecret: EnvVars.GithubClientSecret,
      code,
      redirectUrl: EnvVars.GithubRedirectUri,
    });
    githubAccessToken = data.access_token;
  } catch {
    throw new BadRequestException(Errors.GITHUB_AUTH_FAILED);
  }

  const octokit = new Octokit({ auth: githubAccessToken });
  const { data: userData } = await octokit.rest.users.getAuthenticated();

  const githubUsername = userData.login;
  const avatarUrl = userData.avatar_url;

  const updatedUser = await UserRepo.update({
    id: existedUser.id,
    githubAccessToken,
    githubUsername,
    avatarUrl: existedUser.avatarUrl || avatarUrl,
  });

  return UserModel.toPublic(updatedUser);
}

async function unlinkGithub(userId: string): Promise<IPublicUser> {
  const existedUser = await UserRepo.getById(userId);
  if (!existedUser) {
    throw new NotFoundException(Errors.USER_NOT_FOUND);
  }

  const updatedUser = await UserRepo.update({
    id: existedUser.id,
    githubAccessToken: '',
    githubUsername: '',
  });

  return UserModel.toPublic(updatedUser);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  signup,
  signin,
  getMe,
  switchRole,
  addRole,
  getGithubAuthUrl,
  authWithGithub,
  linkGithub,
  unlinkGithub,
} as const;
