import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestLogService } from './request-log.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(RequestLoggerMiddleware.name);

  constructor(private readonly requestLogService: RequestLogService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const startTime = Date.now();

      const log = await this.requestLogService.createPreliminaryLog({
        method: req.method,
        url: req.originalUrl,
        statusCode: null,
        duration: null,
        timestamp: new Date(),
        userAgent: req.headers['user-agent'] || '',
        ip: (req.headers['x-real-ip'] as string) || req.ip,
        body: req?.body,
      });

      res.setHeader('x-request-id', log.id);

      res.on('finish', async () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const logMessage = `${log.method} ${log.url} ${res.statusCode} - ${log.userAgent} ${log.ip} [${log.id}]`;

        if (!res.statusCode.toString().startsWith('2')) {
          this.logger.error(logMessage);
        } else {
          this.logger.log(logMessage);
        }

        setImmediate(async () => {
          await this.requestLogService.updateLog(log.id, {
            statusCode: res.statusCode,
            duration,
          });
        });
      });

      res.on('error', async (error) => {
        setImmediate(async () => {
          await this.requestLogService.updateLog(log.id, {
            statusCode: res.statusCode,
            errorMessage: error.message,
          });
        });
      });
    } catch (error) {
      this.logger.error(error);
    }

    next();
  }
}
