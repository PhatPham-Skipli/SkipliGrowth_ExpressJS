import { Request } from 'express';

import { IUser } from '@src/models/User.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IBeforeTransformResponseType<T = any> {
  type: 'response';
  message: string;
  data: T;
  statusCode?: number;
  // date: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IBeforeTransformPaginationResponseType<T = any> {
  type: 'pagination';
  message?: string;
  data: {
    items: T[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
  };
  statusCode?: number;
}

export interface IResponseType<ResultDataType = null> {
  message: string;
  data: ResultDataType;
  statusCode: number;
  date: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IPaginationResponseType<ResultDataType = any> {
  message: string;
  data: {
    items: ResultDataType[];
    totalCount: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statusCode: number;
  date: Date;
}

export interface IApiInfomation {
  api: string;
  version: string;
  author: string;
  github: string;
  docs?: string;
}

export interface IRequestHasUser extends Request {
  user: IUser;
}
