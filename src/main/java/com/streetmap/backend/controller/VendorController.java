package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.dto.ProductVO;
import com.streetmap.backend.dto.VendorDTO;
import com.streetmap.backend.dto.ApplyVendorDTO;
import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.service.ProductService;
import com.streetmap.backend.service.ReviewService;
import com.streetmap.backend.service.VendorService;
import com.streetmap.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private JwtUtil jwtUtil;

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
     * 获取我的摊位信息（从 Token 解析 userId）
     * GET /api/vendor/my
     */
    @GetMapping("/my")
    public Result<VendorDTO> getMyVendor(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        VendorDTO vendor = vendorService.getMyVendor(userId);
        if (vendor == null) {
            return Result.error("您还没有摊位");
        }
        return Result.success(vendor);
    }

    /**
     * 修改摊位状态 (开/收摊)
     * PUT /api/vendor/status
     */
    @PutMapping("/status")
    public Result<?> updateStatus(@RequestHeader("Authorization") String token, 
                              @RequestBody Map<String, Object> params) {
        try {
            Long userId = getUserIdFromToken(token);
            Integer status = (Integer) params.get("status");
            
            // 提取经纬度 (如果是开摊操作)
            BigDecimal lat = null;
            BigDecimal lng = null;
            if (status == 1 && params.get("latitude") != null) {
                lat = new BigDecimal(params.get("latitude").toString());
                lng = new BigDecimal(params.get("longitude").toString());
            }

            vendorService.updateVendorStatus(userId, status, lat, lng);
            return Result.success(status == 1 ? "开摊成功！位置已更新" : "收摊成功，辛苦了！");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 申请成为摊主
     */
    @PostMapping("/apply")
    public Result<?> applyVendor(@RequestHeader("Authorization") String token,
                             @RequestBody ApplyVendorDTO dto) {
        try {
            Long userId = getUserIdFromToken(token);
            vendorService.applyVendor(userId, dto);
            return Result.success("申请成功，您已成为摊主！");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 编辑摊主手机号（同步更新到 user 表）
     * PUT /api/vendor/phone
     */
    @PutMapping("/phone")
    public Result<?> updatePhone(@RequestHeader("Authorization") String token,
                              @RequestBody Map<String, String> params) {
        try {
            Long userId = getUserIdFromToken(token);
            String phone = params.get("phone");

            if (phone == null || phone.trim().isEmpty()) {
                return Result.error("请填写手机号！");
            }
            if (!phone.matches("^1[3-9]\\d{9}$")) {
                return Result.error("手机号格式不正确！");
            }

            vendorService.updatePhone(userId, phone);
            return Result.success("手机号更新成功！");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
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

    /**
     * 从 Authorization header 中提取 userId
     */
    private Long getUserIdFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtUtil.getUserIdFromToken(token);
    }
}