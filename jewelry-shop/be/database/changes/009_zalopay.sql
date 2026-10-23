-- Giai doan 8: thanh toan qua cong ZaloPay (sandbox). Chi them, khong xoa gi.
-- 1) Them phuong thuc thanh toan "zalopay" cho don hang.
-- 2) Bang giao dich ZaloPay: moi lan tao ma QR la mot dong, app_trans_id duy nhat.

ALTER TABLE `orders`
  MODIFY COLUMN `paymentMethod` enum('cod','bank_transfer','zalopay') NOT NULL;

CREATE TABLE IF NOT EXISTS `zalopay_transactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `orderId` int unsigned NOT NULL,
  `appTransId` varchar(40) NOT NULL,
  `amount` decimal(15,0) NOT NULL,
  `status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `orderUrl` varchar(1000) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `zpTransId` bigint unsigned DEFAULT NULL,
  `channel` int DEFAULT NULL,
  `paidAt` datetime DEFAULT NULL,
  `callbackData` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_zalopay_transactions_appTransId` (`appTransId`),
  KEY `idx_zalopay_transactions_orderId_createdAt` (`orderId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `zalopay_transactions`
  ADD CONSTRAINT `fk_zalopay_transactions_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
