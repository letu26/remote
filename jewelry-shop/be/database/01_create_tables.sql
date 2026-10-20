-- Tao bang (khong co khoa ngoai)
-- Chay theo thu tu: 01_create_tables.sql roi 02_add_foreign_keys.sql

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int unsigned NOT NULL,
  `receiverName` varchar(100) NOT NULL,
  `receiverPhone` varchar(20) NOT NULL,
  `provinceId` int unsigned NOT NULL,
  `wardId` int unsigned NOT NULL,
  `detail` varchar(255) NOT NULL,
  `isDefault` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_addresses_userId` (`userId`),
  KEY `idx_addresses_provinceId` (`provinceId`),
  KEY `idx_addresses_wardId` (`wardId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `articles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `title` varchar(255) NOT NULL,
  `slug` varchar(280) NOT NULL,
  `thumbnailUrl` varchar(500) DEFAULT NULL,
  `thumbnailPublicId` varchar(255) DEFAULT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `content` longtext NOT NULL,
  `authorId` int unsigned DEFAULT NULL,
  `isPublished` tinyint NOT NULL DEFAULT '0',
  `publishedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_articles_slug` (`slug`),
  KEY `idx_articles_isPublished` (`isPublished`),
  KEY `idx_articles_authorId` (`authorId`),
  KEY `idx_articles_isPublished_publishedAt` (`isPublished`,`publishedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `banners` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `title` varchar(150) NOT NULL,
  `imageUrl` varchar(500) NOT NULL,
  `imagePublicId` varchar(255) DEFAULT NULL,
  `linkUrl` varchar(500) DEFAULT NULL,
  `position` varchar(50) NOT NULL DEFAULT 'home',
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_banners_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `cartId` int unsigned NOT NULL,
  `variantId` int unsigned NOT NULL,
  `quantity` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_items_cartId_variantId` (`cartId`,`variantId`),
  KEY `idx_cart_items_variantId` (`variantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `carts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carts_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `parentId` int unsigned DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_parentId` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `collections` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(150) NOT NULL,
  `slug` varchar(170) NOT NULL,
  `description` text,
  `bannerUrl` varchar(500) DEFAULT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_collections_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `faqs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `keywords` text,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `gemstones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(100) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gemstones_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `materials` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(100) NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_materials_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `menus` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `label` varchar(100) NOT NULL,
  `url` varchar(255) NOT NULL,
  `parentId` int unsigned DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `placement` enum('header','footer') NOT NULL DEFAULT 'header',
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_menus_parentId` (`parentId`),
  KEY `idx_menus_placement_isActive_sortOrder` (`placement`,`isActive`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `orderId` int unsigned NOT NULL,
  `variantId` int unsigned NOT NULL,
  `productName` varchar(200) NOT NULL,
  `productCode` varchar(50) NOT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `size` varchar(30) NOT NULL DEFAULT '',
  `unitPrice` decimal(15,0) NOT NULL,
  `quantity` int unsigned NOT NULL,
  `lineTotal` decimal(15,0) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_orderId` (`orderId`),
  KEY `idx_order_items_variantId` (`variantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `orderId` int unsigned NOT NULL,
  `status` enum('pending','confirmed','preparing','shipping','delivered','cancelled') NOT NULL,
  `changedById` int unsigned DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_status_history_orderId` (`orderId`),
  KEY `idx_order_status_history_changedById` (`changedById`),
  KEY `idx_order_status_history_status_createdAt` (`status`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `code` varchar(30) NOT NULL,
  `userId` int unsigned NOT NULL,
  `receiverName` varchar(100) NOT NULL,
  `receiverPhone` varchar(20) NOT NULL,
  `provinceName` varchar(100) NOT NULL,
  `wardName` varchar(100) NOT NULL,
  `addressDetail` varchar(255) NOT NULL,
  `note` text,
  `shippingMethodId` int unsigned NOT NULL,
  `shippingMethodName` varchar(100) NOT NULL DEFAULT '',
  `subtotal` decimal(15,0) NOT NULL,
  `shippingFee` decimal(15,0) NOT NULL DEFAULT '0',
  `total` decimal(15,0) NOT NULL,
  `paymentMethod` enum('cod','bank_transfer') NOT NULL,
  `paymentStatus` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `paidAt` datetime DEFAULT NULL,
  `status` enum('pending','confirmed','preparing','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `cancelReason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_code` (`code`),
  KEY `idx_orders_status_createdAt` (`status`,`createdAt`),
  KEY `idx_orders_userId_createdAt` (`userId`,`createdAt`),
  KEY `idx_orders_shippingMethodId` (`shippingMethodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `slug` varchar(120) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pages_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_gemstones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `productId` int unsigned NOT NULL,
  `gemstoneId` int unsigned NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `carat` decimal(8,3) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `clarity` varchar(50) DEFAULT NULL,
  `cut` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_gemstones_productId` (`productId`),
  KEY `idx_product_gemstones_gemstoneId` (`gemstoneId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `productId` int unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `publicId` varchar(255) DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isPrimary` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_product_images_productId` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `productId` int unsigned NOT NULL,
  `sku` varchar(60) NOT NULL,
  `size` varchar(30) NOT NULL DEFAULT '',
  `stock` int unsigned NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  `version` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_variants_sku` (`sku`),
  UNIQUE KEY `uq_product_variants_productId_size` (`productId`,`size`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `description` text,
  `categoryId` int unsigned NOT NULL,
  `materialId` int unsigned DEFAULT NULL,
  `collectionId` int unsigned DEFAULT NULL,
  `targetGroup` enum('men','women','unisex','kids') NOT NULL DEFAULT 'unisex',
  `weight` decimal(10,3) DEFAULT NULL,
  `costPrice` decimal(15,0) NOT NULL DEFAULT '0',
  `price` decimal(15,0) NOT NULL,
  `warrantyInfo` text,
  `certificate` varchar(255) DEFAULT NULL,
  `isFeatured` tinyint NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  `soldCount` int unsigned NOT NULL DEFAULT '0',
  `avgRating` decimal(3,2) NOT NULL DEFAULT '0.00',
  `reviewCount` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_code` (`code`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `idx_products_categoryId` (`categoryId`),
  KEY `idx_products_materialId` (`materialId`),
  KEY `idx_products_collectionId` (`collectionId`),
  KEY `idx_products_isActive_categoryId_price` (`isActive`,`categoryId`,`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `promotions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(150) NOT NULL,
  `productId` int unsigned NOT NULL,
  `discountPercent` tinyint unsigned NOT NULL,
  `startsAt` datetime NOT NULL,
  `endsAt` datetime NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_promotions_productId_startsAt_endsAt` (`productId`,`startsAt`,`endsAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `provinces` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `code` int unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provinces_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int unsigned NOT NULL,
  `productId` int unsigned NOT NULL,
  `orderItemId` int unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text,
  `isHidden` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reviews_orderItemId` (`orderItemId`),
  KEY `idx_reviews_userId` (`userId`),
  KEY `idx_reviews_productId` (`productId`),
  UNIQUE KEY `uq_reviews_userId_productId` (`userId`,`productId`),
  KEY `idx_reviews_productId_isHidden_createdAt` (`productId`,`isHidden`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `shipping_methods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `fee` decimal(15,0) NOT NULL DEFAULT '0',
  `isActive` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `setting_key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_site_settings_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `token_blacklist` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int unsigned NOT NULL,
  `scope` enum('token','all_before') NOT NULL,
  `jti` varchar(64) DEFAULT NULL,
  `issuedBefore` datetime(3) DEFAULT NULL,
  `reason` enum('logout','change_password','reset_password') NOT NULL,
  `expiresAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_blacklist_jti` (`jti`),
  KEY `idx_token_blacklist_userId_scope` (`userId`, `scope`),
  KEY `idx_token_blacklist_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `fullName` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `status` enum('active','locked') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `wards` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `code` int unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `provinceId` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wards_code` (`code`),
  KEY `idx_wards_provinceId` (`provinceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `wishlists` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userId` int unsigned NOT NULL,
  `productId` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wishlists_userId_productId` (`userId`,`productId`),
  KEY `idx_wishlists_productId` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
