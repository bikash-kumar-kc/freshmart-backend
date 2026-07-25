export interface ILoginResponseType {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export type IRefreshType = Omit<ILoginResponseType, 'userId'>;
