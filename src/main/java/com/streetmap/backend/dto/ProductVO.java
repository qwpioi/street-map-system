package com.streetmap.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 商品 VO
 */
@Data
public class ProductVO {
    private Long id;
    private Long vendorId;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private Integer status;
}
