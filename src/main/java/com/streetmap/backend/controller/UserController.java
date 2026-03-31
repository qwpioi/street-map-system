package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.entity.User;
import com.streetmap.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.streetmap.backend.util.JwtUtil;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户 Controller
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 用户注册
     * POST /api/user/register
     */
    @PostMapping("/register")
    public Result<User> register(@RequestBody User user) {
        userService.register(user);
        return Result.success(user);
    }

    /**
     * 用户登录
     * POST /api/user/login
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody User user) {
        User loginUser = userService.login(user.getUsername(), user.getPassword());

        // 生成 token
        String token = JwtUtil.generateToken(loginUser.getId(), loginUser.getUsername());

        // 返回用户信息和 token
        Map<String, Object> data = new HashMap<>();
        data.put("user", loginUser);
        data.put("token", token);

        return Result.success(data);
    }

    /**
     * 根据 ID 查询用户
     * GET /api/user/{id}
     */
    @GetMapping("/{id}")
    public Result<User> getById(@PathVariable Long id) {
        User user = userService.getById(id);
        return Result.success(user);
    }

    /**
     * 更新用户信息
     * PUT /api/user
     */
    @PutMapping
    public Result<Boolean> update(@RequestBody User user) {
        boolean success = userService.updateById(user);
        return Result.success(success);
    }

    /**
     * 删除用户
     * DELETE /api/user/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        boolean success = userService.removeById(id);
        return Result.success(success);
    }
}