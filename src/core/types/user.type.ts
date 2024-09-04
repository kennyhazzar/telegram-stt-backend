import { Request } from 'express';

export type UserJwtPayload = {
  id: string;
  telegramId: number;
}
export type UserRequestContext = Request & { user: UserJwtPayload };
