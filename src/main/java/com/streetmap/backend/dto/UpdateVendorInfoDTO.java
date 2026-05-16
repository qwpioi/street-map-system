package com.streetmap.backend.dto;

import lombok.Data;

@Data
public class UpdateVendorInfoDTO {
    private String stallName;  // 摊位名称
    private String phone;      // 手机号
    private String avatar;     // 摊位头像URL
}
