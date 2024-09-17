import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as ipRangeCheck from 'ip-range-check';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private logger = new Logger(IpWhitelistGuard.name);

  private readonly trustedIps = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
    '77.75.154.128/25',
    '2a02:5180::/32',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = (request.headers['x-real-ip'] as string) || request.ip;

    this.logger.log({ clientIp });

    const isTrusted = this.trustedIps.some((ip) => ipRangeCheck(clientIp, ip));

    if (!isTrusted) {
      throw new ForbiddenException('Access denied from this IP');
    }

    return true;
  }
}
