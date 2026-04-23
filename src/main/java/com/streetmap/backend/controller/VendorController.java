package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.dto.ProductVO;
import com.streetmap.backend.dto.VendorDTO;
import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.service.ProductService;
import com.streetmap.backend.service.ReviewService;
import com.streetmap.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 摊主 Controller
 */
@RestController
@RequestMapping("/api/vendor")
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @Autowired
    private ProductService productService;

    @Autowired
    private ReviewService reviewService;

    /**
     * 注册成为摊主
     * POST /api/vendor/register
     */
    @PostMapping("/register")
    public Result<Vendor> register(@RequestBody Vendor vendor) {
        vendorService.save(vendor);
        return Result.success(vendor);
    }

    /**
     * 根据用户 ID 查询摊位
     * GET /api/vendor/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public Result<Vendor> getByUserId(@PathVariable Long userId) {
        Vendor vendor = vendorService.findByUserId(userId);
        return Result.success(vendor);
    }

    /**
     * 根据 ID 查询摊位（含评价和商品数据）
     * GET /api/vendor/{id}
     */
    @GetMapping("/{id}")
    public Result<VendorDTO> getById(@PathVariable Long id) {
        Vendor vendor = vendorService.getById(id);
        return Result.success(convertToDTO(vendor));
    }

    /**
     * 查询所有开摊的摊位（含评价和商品数据）
     * GET /api/vendor/open
     */
    @GetMapping("/open")
    public Result<List<VendorDTO>> getOpenVendors() {
        List<Vendor> vendors = vendorService.findOpenVendors();
        List<VendorDTO> dtos = vendors.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return Result.success(dtos);
    }

    /**
     * 查询附近的摊位（含评价和商品数据）
     * GET /api/vendor/nearby?latitude=xxx&longitude=xxx&range=xxx
     */
    @GetMapping("/nearby")
    public Result<List<VendorDTO>> getNearbyVendors(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "0.1") Double range) {
        List<Vendor> vendors = vendorService.findNearbyVendors(latitude, longitude, range);
        List<VendorDTO> dtos = vendors.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return Result.success(dtos);
    }

    /**
     * 开摊
     * POST /api/vendor/open
     */
    @PostMapping("/open")
    public Result<Boolean> openStall(
            @RequestParam Long userId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam String address) {
        boolean success = vendorService.openStall(userId, latitude, longitude, address);
        return Result.success(success);
    }

    /**
     * 收摊
     * POST /api/vendor/close
     */
    @PostMapping("/close")
    public Result<Boolean> closeStall(@RequestParam Long userId) {
        boolean success = vendorService.closeStall(userId);
        return Result.success(success);
    }

    /**
     * 更新摊位信息
     * PUT /api/vendor
     */
    @PutMapping
    public Result<Boolean> update(@RequestBody Vendor vendor) {
        boolean success = vendorService.updateById(vendor);
        return Result.success(success);
    }

    /**
     * 转换为 DTO（含评价和商品数据）
     */
    private VendorDTO convertToDTO(Vendor vendor) {
        VendorDTO dto = new VendorDTO();
        BeanUtils.copyProperties(vendor, dto);
        
        // 添加评价信息
        dto.setAverageRating(reviewService.getAverageRating(vendor.getId()));
        dto.setReviewCount(reviewService.countByVendorId(vendor.getId()));
        
        // 添加商品列表
        List<ProductVO> products = productService.getProductsByVendorId(vendor.getId());
        dto.setProducts(products);
        
        return dto;
    }
}