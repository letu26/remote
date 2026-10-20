-- Doi ten chi muc do TypeORM tao (IDX_/FK_/REL_) sang quy uoc idx_/uq_<bang>_<cot>. Chi doi ten, khong xoa.

ALTER TABLE `addresses`
  RENAME INDEX `FK_606f0676c1ba471832c2fb97382` TO `idx_addresses_wardId`,
  RENAME INDEX `FK_fcec2e72402c8ba8f8f32e6ac93` TO `idx_addresses_provinceId`,
  RENAME INDEX `IDX_95c93a584de49f0b0e13f75363` TO `idx_addresses_userId`;

ALTER TABLE `articles`
  RENAME INDEX `FK_65d9ccc1b02f4d904e90bd76a34` TO `idx_articles_authorId`,
  RENAME INDEX `IDX_1123ff6815c5b8fec0ba9fec37` TO `uq_articles_slug`,
  RENAME INDEX `IDX_44ff7002e9677355ba5fd13926` TO `idx_articles_isPublished`;

ALTER TABLE `banners`
  RENAME INDEX `IDX_4ece2bd0b68375b878351af999` TO `idx_banners_position`;

ALTER TABLE `cart_items`
  RENAME INDEX `IDX_5a27845bc2d79be6f1fa3d2c03` TO `idx_cart_items_variantId`,
  RENAME INDEX `IDX_b6efb56bc53b16c85d8c987e62` TO `uq_cart_items_cartId_variantId`;

ALTER TABLE `carts`
  RENAME INDEX `IDX_69828a178f152f157dcf2f70a8` TO `uq_carts_userId`;

ALTER TABLE `categories`
  RENAME INDEX `IDX_420d9f679d41281f282f5bc7d0` TO `uq_categories_slug`,
  RENAME INDEX `IDX_9a6f051e66982b5f0318981bca` TO `idx_categories_parentId`;

ALTER TABLE `collections`
  RENAME INDEX `IDX_99d0d14f9f23b45d2c6648c4b5` TO `uq_collections_slug`;

ALTER TABLE `gemstones`
  RENAME INDEX `IDX_cbeacbf748b46e0cf2d694f5cb` TO `uq_gemstones_name`;

ALTER TABLE `materials`
  RENAME INDEX `IDX_9b614bb357c5d8741a1a381385` TO `uq_materials_name`;

ALTER TABLE `menus`
  RENAME INDEX `IDX_8523e13f1ba719e16eb474657e` TO `idx_menus_parentId`;

ALTER TABLE `order_items`
  RENAME INDEX `IDX_516736b9807228bb17b2d0a3e2` TO `idx_order_items_variantId`,
  RENAME INDEX `IDX_f1d359a55923bb45b057fbdab0` TO `idx_order_items_orderId`;

ALTER TABLE `order_status_history`
  RENAME INDEX `FK_995002806e351edfa1d8450d82c` TO `idx_order_status_history_changedById`,
  RENAME INDEX `IDX_689db3835e5550e68d26ca3267` TO `idx_order_status_history_orderId`;

ALTER TABLE `orders`
  RENAME INDEX `FK_660cb111d798297b9140c08c791` TO `idx_orders_shippingMethodId`,
  RENAME INDEX `IDX_30e6836e8539f85bfc47198067` TO `idx_orders_userId_createdAt`,
  RENAME INDEX `IDX_3e413c10c595c04c6c70e58a4d` TO `uq_orders_code`,
  RENAME INDEX `IDX_d5e3786a82fe691d8bbbb1e256` TO `idx_orders_status_createdAt`;

ALTER TABLE `pages`
  RENAME INDEX `IDX_fe66ca6a86dc94233e5d778953` TO `uq_pages_slug`;

ALTER TABLE `password_reset_tokens`
  RENAME INDEX `IDX_1143abb8c3fad8b06dd857a8c9` TO `uq_password_reset_tokens_tokenHash`,
  RENAME INDEX `IDX_d6a19d4b4f6c62dcd29daa497e` TO `idx_password_reset_tokens_userId`;

ALTER TABLE `product_gemstones`
  RENAME INDEX `IDX_1f9bd99a20bd26fe1126085803` TO `idx_product_gemstones_productId`,
  RENAME INDEX `IDX_b40fc4983926057233579a0077` TO `idx_product_gemstones_gemstoneId`;

ALTER TABLE `product_images`
  RENAME INDEX `IDX_b367708bf720c8dd62fc683316` TO `idx_product_images_productId`;

ALTER TABLE `product_variants`
  RENAME INDEX `IDX_274d3685fec36698a94529192f` TO `uq_product_variants_productId_size`,
  RENAME INDEX `IDX_46f236f21640f9da218a063a86` TO `uq_product_variants_sku`;

ALTER TABLE `products`
  RENAME INDEX `IDX_464f927ae360106b783ed0b410` TO `uq_products_slug`,
  RENAME INDEX `IDX_53823b875c14daa5e9009ee683` TO `idx_products_collectionId`,
  RENAME INDEX `IDX_7cfc24d6c24f0ec91294003d6b` TO `uq_products_code`,
  RENAME INDEX `IDX_98279ddd6bbdbe307c589eb397` TO `idx_products_isActive_categoryId_price`,
  RENAME INDEX `IDX_a8799fc4f582524b0614bfddea` TO `idx_products_materialId`,
  RENAME INDEX `IDX_ff56834e735fa78a15d0cf2192` TO `idx_products_categoryId`;

ALTER TABLE `promotions`
  RENAME INDEX `IDX_aca335066628b9fa1fe3ac7bf0` TO `idx_promotions_productId_startsAt_endsAt`;

ALTER TABLE `provinces`
  RENAME INDEX `IDX_f4b684af62d5cb3aa174f6b9b8` TO `uq_provinces_code`;

ALTER TABLE `reviews`
  RENAME INDEX `IDX_1e6c554d615dd5a5bf0e11ee0e` TO `uq_reviews_orderItemId`,
  RENAME INDEX `IDX_7ed5659e7139fc8bc039198cc1` TO `idx_reviews_userId`,
  RENAME INDEX `IDX_a6b3c434392f5d10ec17104366` TO `idx_reviews_productId`;

ALTER TABLE `site_settings`
  RENAME INDEX `IDX_1934695e327dbd254a6d031994` TO `uq_site_settings_setting_key`;

ALTER TABLE `users`
  RENAME INDEX `IDX_97672ac88f789774dd47f7c8be` TO `uq_users_email`,
  RENAME INDEX `IDX_a000cca60bcf04454e72769949` TO `uq_users_phone`;

ALTER TABLE `wards`
  RENAME INDEX `IDX_24f16d2207b1dcb6ce07d81d20` TO `uq_wards_code`,
  RENAME INDEX `IDX_94149b5470f5d69f6a9e1c223a` TO `idx_wards_provinceId`;

ALTER TABLE `wishlists`
  RENAME INDEX `IDX_063c6f46d6cbebf35f3a5ec3d4` TO `idx_wishlists_productId`,
  RENAME INDEX `IDX_5629f2896ea05ee200f7a96af4` TO `uq_wishlists_userId_productId`;
