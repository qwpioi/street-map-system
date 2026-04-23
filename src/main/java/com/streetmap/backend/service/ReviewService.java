package com.streetmap.backend.service;

import com.streetmap.backend.dto.ReviewWithUserDTO;
import com.streetmap.backend.entity.Review;
import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;

/**
 * 评价 Service 接口
 */
public interface ReviewService extends IService<Review> {

    /**
     * 根据摊位 ID 查询评价列表
     * @param vendorId 摊位 ID
     * @return 评价列表
     */
    List<Review> findByVendorId(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表
     * @param userId 用户 ID
     * @return 评价列表
     */
    List<Review> findByUserId(Long userId);

    /**
     * 添加评价
     * @param review 评价信息
     * @return 是否成功
     */
    boolean addReview(Review review);

    /**
     * 计算摊位平均评分
     * @param vendorId 摊位 ID
     * @return 平均分
     */
    Double getAverageRating(Long vendorId);

    /**
     * 根据摊位 ID 查询评价列表（关联用户信息）
     */
    List<ReviewWithUserDTO> findByVendorIdWithUser(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表（关联摊位信息）
     */
    List<ReviewWithUserDTO> findByUserIdWithVendor(Long userId);

    /**
     * 统计摊位评价数量
     */
    Long countByVendorId(Long vendorId);

    /**
     * 删除评价
     */
    boolean deleteReview(Long reviewId, Long userId);
}