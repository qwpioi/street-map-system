-- ============================================
-- 地摊地图系统 - 添加微信登录字段
-- 执行时间：2026-04-16
-- ============================================

-- 使用数据库
USE street_map;

-- 添加微信 openid 字段
ALTER TABLE user 
ADD COLUMN openid VARCHAR(64) COMMENT '微信 openid' AFTER username;

-- 添加微信 unionid 字段
ALTER TABLE user 
ADD COLUMN unionid VARCHAR(64) COMMENT '微信 unionid' AFTER openid;

-- 为 openid 添加唯一索引
CREATE INDEX idx_openid ON user(openid);

-- 查看表结构确认
DESC user;

-- 验证添加成功
SELECT 
    id, 
    username, 
    openid, 
    unionid 
FROM user 
LIMIT 5;
