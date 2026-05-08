package com.streetmap.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ApplyVendorDTO {
    private String stallName;    // 摊位名称
    private String description;  // 摊位描述
    private String hotProducts;  // 热销产品
    private String address;      // 地址文本
    private BigDecimal latitude; // 纬度
    private BigDecimal longitude;// 经度
    private String phone;          // 手机号
}
