import { User } from '@resources/user';
import { Request } from 'express';

export type UserRequestContext = Request & { user: User };
