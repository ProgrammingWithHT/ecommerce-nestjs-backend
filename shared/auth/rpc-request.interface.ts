import { AuthenticatedUser } from './authenticated-user.interface';

export interface RpcRequest<T> {
  data: T;
  accessToken?: string;
  authUser?: AuthenticatedUser;
}
