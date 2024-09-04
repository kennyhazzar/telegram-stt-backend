import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRequestContext } from '@core/types';
import { AuthGuard } from '../auth/guards';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getUser(@Req() request: UserRequestContext) {
    return this.userService.getUserWithBalance(request.user.id);
  }

  @Post()
  async createUser(
    @Body()
    createUserDto: {
      telegramId: number;
      username: string;
      firstName: string;
      secondName?: string;
    },
  ) {
    return this.userService.createUser(createUserDto);
  }

  @Patch()
  @UseGuards(AuthGuard)
  async updateUser(
    @Req() request: UserRequestContext,
    @Body() updateUserDto: Partial<User>,
  ) {
    return this.userService.updateUser(request.user.id, updateUserDto);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async deleteUser(@Req() request: UserRequestContext) {
    await this.userService.deleteUser(request.user);
    return { message: 'User deleted successfully' };
  }
}
