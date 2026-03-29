package com.streetmap.backend.service;

import com.streetmap.backend.entity.User;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * 用户 Service 接口
 * 继承 IService 后自动拥有 CRUD 方法
 */
public interface UserService extends IService<User> {

    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户对象
     */
    User findByUsername(String username);

    /**
     * 根据手机号查询用户
     * @param phone 手机号
     * @return 用户对象
     */
    User findByPhone(String phone);

    /**
     * 用户注册
     * @param user 用户信息
     * @return 是否成功
     */
    boolean register(User user);

    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @return 用户对象（登录成功）或 null（失败）
     */
    User login(String username, String password);
}