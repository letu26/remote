import { Module } from '@nestjs/common';
import { PromotionAdminController } from './controllers/promotion-admin.controller.js';
import { PromotionAdminRepository } from './repositories/promotion-admin.repository.js';
import { PromotionAdminService } from './services/promotion-admin.service.js';

/** Quản trị khuyến mại. Giá hiển thị cho khách đọc trực tiếp bảng promotions nên không có cache cần xóa. */
@Module({
  controllers: [PromotionAdminController],
  providers: [PromotionAdminService, PromotionAdminRepository],
})
export class PromotionsAdminModule {}
