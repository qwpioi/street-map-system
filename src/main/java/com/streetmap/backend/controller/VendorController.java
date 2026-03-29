package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.entity.Vendor;
import com.streetmap.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 摊主 Controller
 */
@RestController
@RequestMapping("/api/vendor")
public class VendorController {

    @Autowired
    private VendorService vendorService;

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
     * 查询所有开摊的摊位
     * GET /api/vendor/open
     */
    @GetMapping("/open")
    public Result<List<Vendor>> getOpenVendors() {
        List<Vendor> vendors = vendorService.findOpenVendors();
        return Result.success(vendors);
    }

    /**
     * 查询附近的摊位
     * GET /api/vendor/nearby?latitude=xxx&longitude=xxx&range=xxx
     */
    @GetMapping("/nearby")
    public Result<List<Vendor>> getNearbyVendors(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "0.1") Double range) {
        List<Vendor> vendors = vendorService.findNearbyVendors(latitude, longitude, range);
        return Result.success(vendors);
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
}