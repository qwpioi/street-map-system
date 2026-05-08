package com.streetmap.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 评价 DTO（包含用户信息）
 */
@Data
public class ReviewWithUserDTO {
    private Long reviewId;
    private Long userId;
    private Long vendorId;
    private Integer rating;
    private String content;
    private LocalDateTime createTime;
    
    // 用户信息
    private String userName;
    private String userAvatar;
    
    // 摊位信息（用于用户评价列表）
    private String vendorName;
}
