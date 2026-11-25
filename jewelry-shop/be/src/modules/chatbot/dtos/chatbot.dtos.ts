import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';

export class ChatHistoryDto {
  @IsIn(['user', 'bot'])
  role: 'user' | 'bot';

  @IsString()
  @MaxLength(2000)
  text: string;
}

export class AskChatbotDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  message: string;

  /** Vài lượt gần nhất để AI hiểu câu hỏi nối tiếp; không được lưu lại. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryDto)
  history?: ChatHistoryDto[];
}
