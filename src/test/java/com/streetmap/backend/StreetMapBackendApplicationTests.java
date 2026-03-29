package com.streetmap.backend;

import com.streetmap.backend.mapper.UserMapper;
import com.streetmap.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
class StreetMapBackendApplicationTests {

    @Autowired
    private UserMapper userMapper;

    @Test
    void testMapper() {
        // 测试查询所有用户
        List<User> users = userMapper.selectList(null);
        System.out.println("用户数量：" + users.size());
    }
}