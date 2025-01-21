import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramDataDto } from './dto';
import { ThrottlerBehindProxyGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tg-webapp')
  @UseGuards(ThrottlerBehindProxyGuard)
  @HttpCode(HttpStatus.OK)
  loginViaTelegram(@Body() { data }: TelegramDataDto) {
    return this.authService.loginBySecret(data);
  }
}
