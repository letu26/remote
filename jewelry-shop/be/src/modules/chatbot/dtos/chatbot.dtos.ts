import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';

export class AskChatbotDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  message: string;
}
