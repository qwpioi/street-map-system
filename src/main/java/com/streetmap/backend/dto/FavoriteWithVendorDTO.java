package com.streetmap.backend.dto;

import com.streetmap.backend.util.AddressUtil;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FavoriteWithVendorDTO {
    private Long favoriteId;
    private Long userId;
    private LocalDateTime createTime;

    // 摊位信息
    private Long vendorId;
    private String stallName;
    private String address;
    private String hotProducts;
    private Double latitude;
    private Double longitude;

    /**
     * 重写 setAddress，自动截取详细地址（去掉省市区前缀）
     * MyBatis 结果映射和 BeanUtils.copyProperties 均会调用此 setter
     */
    public void setAddress(String address) {
        this.address = AddressUtil.extractDetailAddress(address);
    }
}
