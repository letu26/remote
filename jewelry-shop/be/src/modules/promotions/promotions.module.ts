import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './models/promotion.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion])],
})
export class PromotionsModule {}
