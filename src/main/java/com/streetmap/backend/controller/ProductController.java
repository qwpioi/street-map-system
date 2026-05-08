package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.dto.ProductVO;
import com.streetmap.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 商品 Controller
 */
@RestController
@RequestMapping("/api/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    /**
     * 获取摊位的商品列表（公开接口）
     * GET /api/product/vendor/{vendorId}
     */
    @GetMapping("/vendor/{vendorId}")
    public Result<List<ProductVO>> getProductsByVendorId(@PathVariable Long vendorId) {
        List<ProductVO> products = productService.getProductsByVendorId(vendorId);
        return Result.success(products);
    }

    /**
     * 添加商品（需要登录，摊主权限）
     * POST /api/product/add
     */
    @PostMapping("/add")
    public Result<ProductVO> addProduct(@RequestBody ProductVO productVO) {
        ProductVO result = productService.addProduct(productVO.getVendorId(), productVO);
        return Result.success(result);
    }

    /**
     * 更新商品（需要登录，摊主权限）
     * PUT /api/product/update
     */
    @PutMapping("/update")
    public Result<ProductVO> updateProduct(@RequestBody ProductVO productVO) {
        ProductVO result = productService.updateProduct(productVO);
        return Result.success(result);
    }

    /**
     * 删除商品（需要登录，摊主权限）
     * DELETE /api/product/{productId}
     */
    @DeleteMapping("/{productId}")
    public Result<Boolean> deleteProduct(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        boolean success = productService.deleteProduct(productId, userId);
        return Result.success(success);
    }

    /**
     * 获取当前登录用户 ID
     */
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        throw new RuntimeException("用户未登录");
    }
}
