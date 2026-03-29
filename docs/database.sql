-- ============================================
-- 地摊地图系统 - 数据库表结构
-- 创建时间：2026-03-29
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `user` (
                                      `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户 ID',
                                      `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    `phone` VARCHAR(20) COMMENT '手机号',
    `email` VARCHAR(100) COMMENT '邮箱',
    `avatar` VARCHAR(255) COMMENT '头像 URL',
    `gender` TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_username` (`username`),
    INDEX `idx_phone` (`phone`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 摊主表
CREATE TABLE IF NOT EXISTS `vendor` (
                                        `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '摊位 ID',
                                        `user_id` BIGINT UNIQUE NOT NULL COMMENT '关联用户 ID',
                                        `stall_name` VARCHAR(100) NOT NULL COMMENT '摊名',
    `description` TEXT COMMENT '摊位描述',
    `hot_products` VARCHAR(500) COMMENT '热销产品',
    `status` TINYINT DEFAULT 0 COMMENT '营业状态：0-收摊，1-开摊',
    `latitude` DECIMAL(10, 8) COMMENT '纬度',
    `longitude` DECIMAL(11, 8) COMMENT '经度',
    `address` VARCHAR(255) COMMENT '详细地址',
    `last_open_time` DATETIME COMMENT '最后开摊时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    INDEX `idx_status` (`status`),
    INDEX `idx_location` (`latitude`, `longitude`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='摊主表';

-- 3. 收藏表
CREATE TABLE IF NOT EXISTS `favorite` (
                                          `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '收藏 ID',
                                          `user_id` BIGINT NOT NULL COMMENT '用户 ID',
                                          `vendor_id` BIGINT NOT NULL COMMENT '摊位 ID',
                                          `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
                                          UNIQUE KEY `uk_user_vendor` (`user_id`, `vendor_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_vendor_id` (`vendor_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 4. 评价表
CREATE TABLE IF NOT EXISTS `review` (
                                        `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评价 ID',
                                        `user_id` BIGINT NOT NULL COMMENT '用户 ID',
                                        `vendor_id` BIGINT NOT NULL COMMENT '摊位 ID',
                                        `rating` INT NOT NULL COMMENT '评分：1-5',
                                        `content` TEXT COMMENT '评价内容',
                                        `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
                                        `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE CASCADE,
    INDEX `idx_vendor_id` (`vendor_id`),
    INDEX `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';