-- Tao khoa ngoai
-- Chay theo thu tu: 01_create_tables.sql roi 02_add_foreign_keys.sql

ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addresses_wardId` FOREIGN KEY (`wardId`) REFERENCES `wards` (`id`);

ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addresses_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addresses_provinceId` FOREIGN KEY (`provinceId`) REFERENCES `provinces` (`id`);

ALTER TABLE `articles`
  ADD CONSTRAINT `fk_articles_authorId` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_variantId` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE;

ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cartId` FOREIGN KEY (`cartId`) REFERENCES `carts` (`id`) ON DELETE CASCADE;

ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parentId` FOREIGN KEY (`parentId`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

ALTER TABLE `menus`
  ADD CONSTRAINT `fk_menus_parentId` FOREIGN KEY (`parentId`) REFERENCES `menus` (`id`) ON DELETE CASCADE;

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_variantId` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_order_status_history_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_order_status_history_changedById` FOREIGN KEY (`changedById`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_shippingMethodId` FOREIGN KEY (`shippingMethodId`) REFERENCES `shipping_methods` (`id`);

ALTER TABLE `product_gemstones`
  ADD CONSTRAINT `fk_product_gemstones_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_gemstones`
  ADD CONSTRAINT `fk_product_gemstones_gemstoneId` FOREIGN KEY (`gemstoneId`) REFERENCES `gemstones` (`id`);

ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_product_variants_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_collectionId` FOREIGN KEY (`collectionId`) REFERENCES `collections` (`id`) ON DELETE SET NULL;

ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_materialId` FOREIGN KEY (`materialId`) REFERENCES `materials` (`id`) ON DELETE SET NULL;

ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`);

ALTER TABLE `promotions`
  ADD CONSTRAINT `fk_promotions_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_orderItemId` FOREIGN KEY (`orderItemId`) REFERENCES `order_items` (`id`);

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `wards`
  ADD CONSTRAINT `fk_wards_provinceId` FOREIGN KEY (`provinceId`) REFERENCES `provinces` (`id`) ON DELETE CASCADE;

ALTER TABLE `wishlists`
  ADD CONSTRAINT `fk_wishlists_productId` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `wishlists`
  ADD CONSTRAINT `fk_wishlists_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `token_blacklist`
  ADD CONSTRAINT `fk_token_blacklist_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;
