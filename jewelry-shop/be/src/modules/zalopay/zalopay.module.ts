import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZaloPayCallbackController, ZaloPayOrderController } from './controllers/zalopay.controllers.js';
import { ZaloPayTransaction } from './models/zalopay-transaction.entity.js';
import { ZaloPayTransactionRepository } from './repositories/zalopay-transaction.repository.js';
import { ZaloPayGateway } from './services/zalopay-gateway.service.js';
import { ZaloPayService } from './services/zalopay.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ZaloPayTransaction])],
  controllers: [ZaloPayOrderController, ZaloPayCallbackController],
  providers: [ZaloPayService, ZaloPayGateway, ZaloPayTransactionRepository],
})
export class ZaloPayModule {}
