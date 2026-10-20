-- Giai doan 4: luu "anh chup" luc dat hang. Chi them cot, khong xoa gi.

ALTER TABLE `orders`
  ADD COLUMN `shippingMethodName` varchar(100) NOT NULL DEFAULT '' AFTER `shippingMethodId`,
  ADD COLUMN `paidAt` datetime DEFAULT NULL AFTER `paymentStatus`,
  ADD COLUMN `cancelReason` varchar(255) DEFAULT NULL AFTER `status`;

ALTER TABLE `order_items`
  ADD COLUMN `imageUrl` varchar(500) DEFAULT NULL AFTER `productCode`;
