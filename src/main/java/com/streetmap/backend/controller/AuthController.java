package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.dto.WechatLoginDTO;
import com.streetmap.backend.entity.User;
import com.streetmap.backend.service.UserService;
import com.streetmap.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Value("${wechat.appid}")
    private String wechatAppid;

    @Value("${wechat.secret}")
    private String wechatSecret;

    private static final String JS_CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code";

    @PostMapping("/wechat-login")
    public Result<Map<String, Object>> wechatLogin(@RequestBody WechatLoginDTO dto) {
        try {
            String code = dto.getCode();
            if (code == null || code.isEmpty()) {
                return Result.error("code 不能为空");
            }

            String sessionUrl = String.format(JS_CODE2SESSION_URL, wechatAppid, wechatSecret, code);
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String sessionResponse = restTemplate.getForObject(sessionUrl, String.class);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode sessionNode = mapper.readTree(sessionResponse);

            String openid = sessionNode.get("openid").asText();
            String sessionKey = sessionNode.has("session_key") ? sessionNode.get("session_key").asText() : null;
            String unionid = sessionNode.has("unionid") ? sessionNode.get("unionid").asText() : null;

            if (openid == null || openid.isEmpty()) {
                String errMsg = sessionNode.has("errmsg") ? sessionNode.get("errmsg").asText() : "微信登录失败";
                return Result.error(errMsg);
            }

            User user = userService.findByOpenid(openid);
            
            if (user == null) {
                user = new User();
                user.setUsername("wx_" + openid.substring(openid.length() - 8));
                user.setPassword(java.util.UUID.randomUUID().toString());
                user.setOpenid(openid);
                user.setUnionid(unionid);
                user.setStatus(1);
                
                if (dto.getEncryptedData() != null && dto.getIv() != null && sessionKey != null) {
                    try {
                        String userInfoJson = decryptUserInfo(dto.getEncryptedData(), dto.getIv(), sessionKey);
                        com.fasterxml.jackson.databind.JsonNode userInfo = mapper.readTree(userInfoJson);
                        user.setAvatar(userInfo.has("avatarUrl") ? userInfo.get("avatarUrl").asText() : null);
                        user.setUsername(userInfo.has("nickName") ? userInfo.get("nickName").asText() : user.getUsername());
                    } catch (Exception e) {
                        // 解密失败不影响登录
                    }
                }
                
                userService.save(user);
            }

            String token = JwtUtil.generateToken(user.getId(), user.getUsername());

            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("user", user);

            return Result.success(data);

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("登录失败：" + e.getMessage());
        }
    }

    private String decryptUserInfo(String encryptedData, String iv, String sessionKey) {
        try {
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE,
                new javax.crypto.spec.SecretKeySpec(java.util.Base64.getDecoder().decode(sessionKey), "AES"),
                new javax.crypto.spec.IvParameterSpec(java.util.Base64.getDecoder().decode(iv)));
            byte[] result = cipher.doFinal(java.util.Base64.getDecoder().decode(encryptedData));
            return new String(result, "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("解密失败", e);
        }
    }
}
