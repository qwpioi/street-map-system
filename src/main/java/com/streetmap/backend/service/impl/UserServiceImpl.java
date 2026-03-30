package com.streetmap.backend.service.imlp;

import com.streetmap.backend.entity.User;
import com.streetmap.backend.mapper.UserMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.streetmap.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

/**
 * 用户 Service 实现类
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired
    private UserMapper userMapper;

    /**
     * JWT 密钥（后续移到配置文件）
     */
    private static final String JWT_SECRET = "your-secret-key-here-must-be-at-least-32-characters-long";

    @Override
    public User findByUsername(String username) {
        return userMapper.findByUsername(username);
    }

    @Override
    public User findByPhone(String phone) {
        return userMapper.findByPhone(phone);
    }

    @Override
    public boolean register(User user) {
        // 检查用户名是否已存在
        User existUser = findByUsername(user.getUsername());
        if (existUser != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 密码加密（MD5，后续改用 BCrypt）
        user.setPassword(DigestUtils.md5DigestAsHex(user.getPassword().getBytes()));

        // 设置默认值
        user.setGender(0);
        user.setStatus(1);

        // 插入数据库
        return save(user);
    }

    @Override
    public User login(String username, String password) {
        // 查询用户
        User user = findByUsername(username);

        // 密码加密
        String encryptedPassword = DigestUtils.md5DigestAsHex(password.getBytes());

        // 统一验证（不区分用户名错误还是密码错误，提高安全性）
        if (user == null || !user.getPassword().equals(encryptedPassword)) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 检查状态
        if (user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }

        // 返回用户（不返回密码）
        user.setPassword(null);
        return user;
    }
}