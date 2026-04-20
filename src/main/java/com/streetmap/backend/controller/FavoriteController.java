package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.dto.FavoriteWithVendorDTO;
import com.streetmap.backend.entity.Favorite;
import com.streetmap.backend.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 收藏 Controller
 */
@RestController
@RequestMapping("/api/favorite")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    /**
     * 根据用户 ID 查询收藏列表（带摊位信息）
     * GET /api/favorite/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public Result<List<FavoriteWithVendorDTO>> getByUserId(@PathVariable Long userId) {
        List<FavoriteWithVendorDTO> favorites = favoriteService.findByUserIdWithVendor(userId);
        return Result.success(favorites);
    }

    /**
     * 收藏摊位
     * POST /api/favorite/add
     */
    @PostMapping("/add")
    public Result<Boolean> add(@RequestBody Map<String, Long> params) {
        Long userId = params.get("userId");
        Long vendorId = params.get("vendorId");
        boolean success = favoriteService.addFavorite(userId, vendorId);
        return Result.success(success);
    }

    /**
     * 取消收藏
     * DELETE /api/favorite/remove
     */
    @DeleteMapping("/remove")
    public Result<Boolean> remove(@RequestBody Map<String, Long> params) {
        Long userId = params.get("userId");
        Long vendorId = params.get("vendorId");
        boolean success = favoriteService.removeFavorite(userId, vendorId);
        return Result.success(success);
    }

    /**
     * 检查是否已收藏
     * GET /api/favorite/check
     */
    @GetMapping("/check")
    public Result<Boolean> check(
            @RequestParam Long userId,
            @RequestParam Long vendorId) {
        boolean isFavorite = favoriteService.isFavorite(userId, vendorId);
        return Result.success(isFavorite);
    }
}