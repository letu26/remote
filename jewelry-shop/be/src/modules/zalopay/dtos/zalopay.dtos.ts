import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

/** Thân callback ZaloPay gửi về: `data` là chuỗi JSON, `mac` để xác thực bằng key2. */
export class ZaloPayCallbackDto {
  @IsString()
  @MaxLength(20_000)
  data: string;

  @IsString()
  @MaxLength(200)
  mac: string;

  @IsOptional()
  @IsInt()
  type?: number;
}
