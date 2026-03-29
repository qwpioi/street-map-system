package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.entity.Favorite;
import com.streetmap.backend.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 收藏 Controller
 */
@RestController
@RequestMapping("/api/favorite")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    /**
     * 根据用户 ID 查询收藏列表
     * GET /api/favorite/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public Result<List<Favorite>> getByUserId(@PathVariable Long userId) {
        List<Favorite> favorites = favoriteService.findByUserId(userId);
        return Result.success(favorites);
    }

    /**
     * 收藏摊位
     * POST /api/favorite/add
     */
    @PostMapping("/add")
    public Result<Boolean> add(
            @RequestParam Long userId,
            @RequestParam Long vendorId) {
        boolean success = favoriteService.addFavorite(userId, vendorId);
        return Result.success(success);
    }

    /**
     * 取消收藏
     * DELETE /api/favorite/remove
     */
    @DeleteMapping("/remove")
    public Result<Boolean> remove(
            @RequestParam Long userId,
            @RequestParam Long vendorId) {
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