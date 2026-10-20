-- Them cot publicId (ma anh tren Cloudinary) de xoa anh khi xoa san pham/anh. Chi them, khong xoa gi.

ALTER TABLE `product_images`
  ADD COLUMN `publicId` varchar(255) DEFAULT NULL AFTER `url`;
