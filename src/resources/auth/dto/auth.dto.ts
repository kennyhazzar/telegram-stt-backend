import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TelegramDataDto {
  @IsString()
  @IsNotEmpty()
  hash: string;
  @IsNumber()
  @IsNotEmpty()
  telegramId: number;
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @IsString()
  @IsNotEmpty()
  secondName: string;
  @IsString()
  @IsNotEmpty()
  username: string;
}
