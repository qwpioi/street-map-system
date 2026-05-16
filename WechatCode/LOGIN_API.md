# 微信登录后端接口说明

## 接口地址

```
POST /api/auth/wechat-login
```

## 请求参数

```json
{
  "code": "微信登录凭证 code",
  "encryptedData": "用户数据加密数据（可选）",
  "iv": "加密算法初始向量（可选）"
}
```

## 响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "JWT 令牌",
    "user": {
      "id": "用户 ID",
      "nickName": "用户昵称",
      "avatarUrl": "用户头像",
      "openid": "用户 openid"
    }
  }
}
```

### 失败响应

```json
{
  "code": 400,
  "message": "错误信息"
}
```

## 后端实现逻辑

1. 使用 `code` 调用微信接口 `https://api.weixin.qq.com/sns/jscode2session`
2. 获取 `openid` 和 `session_key`
3. 解密 `encryptedData` 获取用户信息（如果提供）
4. 创建或更新用户记录
5. 生成 JWT token 返回给前端

## 微信接口文档

- 微信登录：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
- 用户数据解密：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html

## 注意事项

1. 前端 API 地址配置在 `pages/login/login.js` 中的 `API_BASE_URL`
2. 确保后端 CORS 配置允许小程序域名访问
3. token 建议设置 7 天有效期
