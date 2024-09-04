import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramDataDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tg-webapp')
  loginViaTelegram(@Body() telegramData: TelegramDataDto) {
    return this.authService.loginBySecret(telegramData);
  }
}
