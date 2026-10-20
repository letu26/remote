import { IsEmail, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsHttpsUrl } from '../../../utils/link-url.util.js';
import { Trim } from '../../../utils/transforms.js';

const SOCIAL_MESSAGE = 'Chỉ chấp nhận để trống hoặc URL https://';

/** Trường mạng xã hội: rỗng hoặc URL https, tối đa 255 ký tự. */
function Social() {
  return function (target: object, propertyKey: string) {
    Trim()(target, propertyKey);
    IsString()(target, propertyKey);
    MaxLength(255)(target, propertyKey);
    ValidateIf((_, value: string) => value !== '')(target, propertyKey);
    IsHttpsUrl({ message: SOCIAL_MESSAGE })(target, propertyKey);
  };
}

export class SiteInfoDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brandName: string;

  @Trim()
  @IsString()
  @MaxLength(150)
  slogan: string;

  @Trim()
  @IsString()
  @MaxLength(30)
  hotline: string;

  @Trim()
  @IsString()
  @MaxLength(150)
  @ValidateIf((_, value: string) => value !== '')
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @Trim()
  @IsString()
  @MaxLength(255)
  address: string;

  @Trim()
  @IsString()
  @MaxLength(100)
  openingHours: string;

  @Social()
  facebook: string;

  @Social()
  zalo: string;

  @Social()
  instagram: string;

  @Social()
  tiktok: string;

  @Trim()
  @IsString()
  @MaxLength(300)
  footerText: string;
}

export type SiteInfo = { [K in keyof SiteInfoDto]: string };

export const SITE_INFO_DEFAULTS: SiteInfo = {
  brandName: 'Lumière Gems',
  slogan: 'Trang sức đá quý tinh tế',
  hotline: '1900 0000',
  email: 'lienhe@example.com',
  address: 'Số 1, Phố Mẫu, Hà Nội',
  openingHours: '08:30 - 21:00 mỗi ngày',
  facebook: '',
  zalo: '',
  instagram: '',
  tiktok: '',
  footerText: '',
};

export const SITE_INFO_FIELDS = Object.keys(SITE_INFO_DEFAULTS) as (keyof SiteInfo)[];

