import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@resources/user';
import { UserService } from '@resources/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify<User>(token);

      const user = await this.usersService.getUser({
        userId: payload.id,
        withBalance: true,
      });

      request.user = user;
    } catch (e) {
      throw new UnauthorizedException(
        typeof e === 'string' ? e : 'Invalid token',
      );
    }

    return true;
  }
}
