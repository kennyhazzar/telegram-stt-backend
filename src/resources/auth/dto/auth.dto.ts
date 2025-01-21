import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramDataDto {
  @IsString()
  @IsNotEmpty()
  data: string;
}
