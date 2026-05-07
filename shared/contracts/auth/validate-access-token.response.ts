import { AuthenticatedUser } from '../../auth/authenticated-user.interface';

export interface ValidateAccessTokenResponse {
  valid: boolean;
  user: AuthenticatedUser;
}
