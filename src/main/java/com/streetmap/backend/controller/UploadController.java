package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    // 本地开发路径（Windows）
    @Value("${upload.path:D:/study/Java/Data/street-map-backend/uploads/images/}")
    private String uploadPath;

    // 图片访问基础URL（直接返回完整URL，前端无需拼接）
    // 开发环境：本地IP地址（HTTP）
    // 生产环境：必须使用 HTTPS，例如 https://api.ditan.asia/images/
    @Value("${upload.image-base-url:http://192.168.1.4:8081/images/}")
    private String imageBaseUrl;

    @PostMapping("/image")
    public Result<String> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error("请选择图片");
        }

        // 验证文件类型
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return Result.error("文件名无效");
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        String[] allowedTypes = {".jpg", ".jpeg", ".png", ".gif", ".webp"};
        boolean isAllowed = false;
        for (String type : allowedTypes) {
            if (type.equals(extension)) {
                isAllowed = true;
                break;
            }
        }
        if (!isAllowed) {
            return Result.error("只支持 jpg、png、gif、webp 格式的图片");
        }

        // 生成唯一文件名
        String newFileName = UUID.randomUUID().toString().replace("-", "") + extension;

        // 确保目录存在
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // 保存文件
        try {
            File dest = new File(uploadPath + newFileName);
            file.transferTo(dest);

            // 返回访问URL
            String imageUrl = imageBaseUrl + newFileName;
            return Result.success(imageUrl);
        } catch (IOException e) {
            return Result.error("上传失败：" + e.getMessage());
        }
    }
}
