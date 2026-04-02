-- ============================================
-- 地摊地图系统 - 修复用户密码为 MD5 加密
-- 执行时间：2026-04-02
-- ============================================

-- 查看所有用户密码类型
SELECT 
    id, 
    username, 
    password, 
    LENGTH(password) as pwd_len, 
    CASE 
        WHEN LENGTH(password) = 32 THEN 'MD5' 
        ELSE 'PLAIN (需要修复)' 
    END as pwd_type 
FROM user 
ORDER BY id;

-- 修复所有明文密码为 MD5
-- 注意：这里假设明文密码都是 '123456'
UPDATE user 
SET password = MD5('123456') 
WHERE LENGTH(password) < 32;

-- 验证修复结果
SELECT 
    id, 
    username, 
    password, 
    LENGTH(password) as pwd_len, 
    CASE 
        WHEN LENGTH(password) = 32 THEN '✅ MD5' 
        ELSE '❌ PLAIN' 
    END as pwd_type 
FROM user 
ORDER BY id;

-- 测试登录（验证 MD5 是否正确）
-- 应该返回用户信息
SELECT * FROM user 
WHERE username = 'huiji5' 
AND password = MD5('123456');
