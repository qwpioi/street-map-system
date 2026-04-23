package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.dto.ReviewWithUserDTO;
import com.streetmap.backend.entity.Review;
import com.streetmap.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 评价 Controller
 */
@RestController
@RequestMapping("/api/review")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * 根据摊位 ID 查询评价列表（关联用户信息）
     * GET /api/review/vendor/{vendorId}/list
     */
    @GetMapping("/vendor/{vendorId}/list")
    public Result<List<ReviewWithUserDTO>> getVendorReviews(@PathVariable Long vendorId) {
        List<ReviewWithUserDTO> reviews = reviewService.findByVendorIdWithUser(vendorId);
        return Result.success(reviews);
    }

    /**
     * 根据摊位 ID 查询评价列表（旧接口兼容）
     * GET /api/review/vendor/{vendorId}
     */
    @GetMapping("/vendor/{vendorId}")
    public Result<List<Review>> getByVendorId(@PathVariable Long vendorId) {
        List<Review> reviews = reviewService.findByVendorId(vendorId);
        return Result.success(reviews);
    }

    /**
     * 获取用户自己的评价列表（关联摊位信息）
     * GET /api/review/user/my-reviews
     */
    @GetMapping("/user/my-reviews")
    public Result<List<ReviewWithUserDTO>> getMyReviews() {
        Long userId = getCurrentUserId();
        List<ReviewWithUserDTO> reviews = reviewService.findByUserIdWithVendor(userId);
        return Result.success(reviews);
    }

    /**
     * 根据用户 ID 查询评价列表（旧接口兼容）
     * GET /api/review/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public Result<List<Review>> getByUserId(@PathVariable Long userId) {
        List<Review> reviews = reviewService.findByUserId(userId);
        return Result.success(reviews);
    }

    /**
     * 添加评价
     * POST /api/review/add
     */
    @PostMapping("/add")
    public Result<Boolean> add(@RequestBody Review review) {
        boolean success = reviewService.addReview(review);
        return Result.success(success);
    }

    /**
     * 获取摊位平均评分
     * GET /api/review/average/{vendorId}
     */
    @GetMapping("/average/{vendorId}")
    public Result<Double> getAverageRating(@PathVariable Long vendorId) {
        Double average = reviewService.getAverageRating(vendorId);
        return Result.success(average != null ? average : 0.0);
    }

    /**
     * 获取摊位评价数量
     * GET /api/review/count/{vendorId}
     */
    @GetMapping("/count/{vendorId}")
    public Result<Long> getCount(@PathVariable Long vendorId) {
        Long count = reviewService.countByVendorId(vendorId);
        return Result.success(count);
    }

    /**
     * 删除评价
     * DELETE /api/review/{reviewId}
     */
    @DeleteMapping("/{reviewId}")
    public Result<Boolean> delete(@PathVariable Long reviewId) {
        Long userId = getCurrentUserId();
        boolean success = reviewService.deleteReview(reviewId, userId);
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