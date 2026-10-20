-- Thay doi 001: luong OTP + blacklist token
-- Them bang token_blacklist va khoa ngoai (chi them, khong xoa gi)

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

ALTER TABLE `token_blacklist`
  ADD CONSTRAINT `fk_token_blacklist_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;
