-- Giai doan 5: moi khach chi danh gia mot san pham mot lan + chi muc tai danh sach danh gia. Chi them, khong xoa gi.

ALTER TABLE `reviews`
  ADD UNIQUE KEY `uq_reviews_userId_productId` (`userId`, `productId`),
  ADD KEY `idx_reviews_productId_isHidden_createdAt` (`productId`, `isHidden`, `createdAt`);
