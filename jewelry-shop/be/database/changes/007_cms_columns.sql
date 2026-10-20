-- Giai doan 6 (CMS): luu ma anh Cloudinary de xoa anh cu, vi tri menu (header/footer), chi muc tai danh sach. Chi them, khong xoa gi.

ALTER TABLE `banners`
  ADD COLUMN `imagePublicId` varchar(255) DEFAULT NULL AFTER `imageUrl`;

ALTER TABLE `articles`
  ADD COLUMN `thumbnailPublicId` varchar(255) DEFAULT NULL AFTER `thumbnailUrl`,
  ADD KEY `idx_articles_isPublished_publishedAt` (`isPublished`, `publishedAt`);

ALTER TABLE `menus`
  ADD COLUMN `placement` enum('header','footer') NOT NULL DEFAULT 'header' AFTER `sortOrder`,
  ADD KEY `idx_menus_placement_isActive_sortOrder` (`placement`, `isActive`, `sortOrder`);
