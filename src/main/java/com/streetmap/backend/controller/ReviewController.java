package com.streetmap.backend.controller;

import com.streetmap.backend.common.Result;
import com.streetmap.backend.entity.Review;
import com.streetmap.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
     * 根据摊位 ID 查询评价列表
     * GET /api/review/vendor/{vendorId}
     */
    @GetMapping("/vendor/{vendorId}")
    public Result<List<Review>> getByVendorId(@PathVariable Long vendorId) {
        List<Review> reviews = reviewService.findByVendorId(vendorId);
        return Result.success(reviews);
    }

    /**
     * 根据用户 ID 查询评价列表
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
        return Result.success(average);
    }
}