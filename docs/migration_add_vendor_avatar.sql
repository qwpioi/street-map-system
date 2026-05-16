-- 为 vendor 表添加 avatar（摊位头像）字段
ALTER TABLE vendor ADD COLUMN avatar VARCHAR(255) COMMENT '摊位头像URL' AFTER hot_products;
