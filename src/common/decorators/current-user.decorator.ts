import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';

/**
 * Request-scoped user decorator
 * Caches the user on the request object to avoid repeated database queries
 * Usage: @CurrentUser() currentUser: User
 */
export const CurrentUser = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Return cached user if already resolved
    if (request.currentUser) {
      return request.currentUser;
    }

    // Resolve and cache user from Firebase auth data
    if (request.user) {
      const usersService = request.app.get(UsersService);
      request.currentUser = await usersService.getOrCreateFromFirebaseUser({
        uid: request.user.id,
        email: request.user.email,
      });
      return request.currentUser;
    }

    return null;
  },
);
