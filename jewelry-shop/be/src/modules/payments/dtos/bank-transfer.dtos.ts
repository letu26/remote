import { Contains, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';

export const ORDER_CODE_PLACEHOLDER = '{orderCode}';

export class BankTransferSettingsDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  bankName: string;

  @Trim()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[0-9 ]+$/, { message: 'Số tài khoản chỉ gồm chữ số hoặc khoảng trắng' })
  accountNumber: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  accountHolder: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Contains(ORDER_CODE_PLACEHOLDER, { message: 'Nội dung chuyển khoản phải chứa {orderCode}' })
  transferNote: string;
}
