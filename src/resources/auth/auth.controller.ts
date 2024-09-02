import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tg-webapp')
  loginViaTelegram(@Body() telegramData: any) {
    return this.authService.loginBySecret(telegramData);
  }
}
