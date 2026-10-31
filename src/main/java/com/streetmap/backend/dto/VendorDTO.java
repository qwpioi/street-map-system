package com.streetmap.backend.dto;

import com.streetmap.backend.util.AddressUtil;
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
    private String avatar;           // 摊位头像URL
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

    // 智能推荐字段
    private Double distance;  // 距离（km）
    private Double score;    // 综合评分

    // 商品列表
    private List<ProductVO> products;

    /**
     * 重写 setAddress，自动截取详细地址（去掉省市区前缀）
     * BeanUtils.copyProperties 会调用此 setter
     */
    public void setAddress(String address) {
        this.address = AddressUtil.extractDetailAddress(address);
    }
}
