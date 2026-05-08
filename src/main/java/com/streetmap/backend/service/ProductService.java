package com.streetmap.backend.service;

import com.streetmap.backend.dto.ProductVO;
import java.util.List;

/**
 * 商品 Service 接口
 */
public interface ProductService {

    /**
     * 获取摊位的商品列表
     */
    List<ProductVO> getProductsByVendorId(Long vendorId);

    /**
     * 添加商品（摊主）
     */
    ProductVO addProduct(Long vendorId, ProductVO productVO);

    /**
     * 更新商品（摊主）
     */
    ProductVO updateProduct(ProductVO productVO);

    /**
     * 删除商品（摊主）
     */
    boolean deleteProduct(Long productId, Long userId);
}
