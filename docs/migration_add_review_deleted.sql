-- ============================================
-- 迁移：review 表添加逻辑删除字段
-- 时间：2026-05-15
-- 说明：为 review 表添加 deleted 字段，
--       使评价表与其他表统一使用逻辑删除
-- ============================================

ALTER TABLE `review`
    ADD COLUMN `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已删除'
    AFTER `update_time`;

-- 为 deleted 字段创建索引，提升查询性能
CREATE INDEX `idx_deleted` ON `review` (`deleted`);
