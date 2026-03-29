package com.streetmap.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.streetmap.backend.mapper")
public class StreetMapBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(StreetMapBackendApplication.class, args);
    }

}
