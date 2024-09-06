import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramDataDto } from './dto';
import { ThrottlerBehindProxyGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tg-webapp')
  @UseGuards(ThrottlerBehindProxyGuard)
  loginViaTelegram(@Body() telegramData: TelegramDataDto) {
    return this.authService.loginBySecret(telegramData);
  }
}
