var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildDatabaseConfig } from './config/database.config.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ArticlesModule } from './modules/articles/articles.module.js';
import { BannersModule } from './modules/banners/banners.module.js';
import { ChatbotModule } from './modules/chatbot/chatbot.module.js';
import { FaqsModule } from './modules/faqs/faqs.module.js';
import { MenusModule } from './modules/menus/menus.module.js';
import { PagesModule } from './modules/pages/pages.module.js';
import { SiteInfoModule } from './modules/site-info/site-info.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { CatalogAdminModule } from './modules/catalog-admin/catalog-admin.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CmsModule } from './modules/cms/cms.module.js';
import { CustomersAdminModule } from './modules/customers-admin/customers-admin.module.js';
import { PromotionsAdminModule } from './modules/promotions-admin/promotions-admin.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ShippingMethodsModule } from './modules/shipping-methods/shipping-methods.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { PromotionsModule } from './modules/promotions/promotions.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { TokenBlacklistModule } from './modules/token-blacklist/token-blacklist.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WishlistsModule } from './modules/wishlists/wishlists.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeOrmModule.forRootAsync({
                inject: [ConfigService],
                useFactory: buildDatabaseConfig,
            }),
            RedisModule,
            TokenBlacklistModule,
            AdminModule,
            AddressesModule,
            AuthModule,
            CartModule,
            CatalogModule,
            CatalogAdminModule,
            CmsModule,
            CustomersAdminModule,
            PromotionsAdminModule,
            StatsModule,
            ArticlesModule,
            BannersModule,
            ChatbotModule,
            FaqsModule,
            MenusModule,
            PagesModule,
            SiteInfoModule,
            LocationsModule,
            OrdersModule,
            PaymentsModule,
            SettingsModule,
            ShippingMethodsModule,
            PromotionsModule,
            ReviewsModule,
            UsersModule,
            WishlistsModule,
        ],
        controllers: [AppController],
        providers: [AppService],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map