package com.streetmap.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 摊位 DTO
 */
@Data
public class VendorDTO {
    private Long id;
    private Long userId;
    private String stallName;
    private String address;
    private String phone;          // 摊主手机号
    private String hotProducts;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer status;
    private LocalDateTime lastOpenTime;
    
    // 用户信息
    private String username;
    private String userAvatar;
    
    // 评价信息
    private Double averageRating;
    private Long reviewCount;
    
    // 商品列表
    private List<ProductVO> products;
}
