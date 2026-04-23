package com.streetmap.backend.service.impl;

import com.streetmap.backend.dto.ReviewWithUserDTO;
import com.streetmap.backend.entity.Review;
import com.streetmap.backend.mapper.ReviewMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.streetmap.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 评价 Service 实现类
 */
@Service
public class ReviewServiceImpl extends ServiceImpl<ReviewMapper, Review> implements ReviewService {

    @Autowired
    private ReviewMapper reviewMapper;

    @Override
    public List<Review> findByVendorId(Long vendorId) {
        return reviewMapper.findByVendorId(vendorId);
    }

    @Override
    public List<Review> findByUserId(Long userId) {
        return reviewMapper.findByUserId(userId);
    }

    @Override
    public boolean addReview(Review review) {
        review.setCreateTime(LocalDateTime.now());
        review.setUpdateTime(LocalDateTime.now());
        return save(review);
    }

    @Override
    public Double getAverageRating(Long vendorId) {
        return reviewMapper.getAverageRating(vendorId);
    }

    @Override
    public List<ReviewWithUserDTO> findByVendorIdWithUser(Long vendorId) {
        return reviewMapper.findByVendorIdWithUser(vendorId);
    }

    @Override
    public List<ReviewWithUserDTO> findByUserIdWithVendor(Long userId) {
        return reviewMapper.findByUserIdWithVendor(userId);
    }

    @Override
    public Long countByVendorId(Long vendorId) {
        return reviewMapper.countByVendorId(vendorId);
    }

    @Override
    public boolean deleteReview(Long reviewId, Long userId) {
        Review review = reviewMapper.findByIdWithUser(reviewId);
        if (review == null) {
            throw new RuntimeException("评价不存在");
        }
        
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("只能删除自己的评价");
        }
        
        return removeById(reviewId);
    }
}