package com.streetmap.backend.dto;

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
}
