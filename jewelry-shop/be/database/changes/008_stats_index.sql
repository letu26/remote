-- Giai doan 7: chi muc de thong ke doanh thu theo ngay giao hang thanh cong. Chi them, khong xoa gi.

ALTER TABLE `order_status_history`
  ADD KEY `idx_order_status_history_status_createdAt` (`status`, `createdAt`);
