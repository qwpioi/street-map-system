package com.streetmap.backend.mapper;

import com.streetmap.backend.dto.ReviewWithUserDTO;
import com.streetmap.backend.entity.Review;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 评价 Mapper 接口
 */
@Mapper
public interface ReviewMapper extends BaseMapper<Review> {

    /**
     * 根据摊位 ID 查询评价列表
     * @param vendorId 摊位 ID
     * @return 评价列表
     */
    @Select("SELECT * FROM review WHERE vendor_id = #{vendorId} ORDER BY create_time DESC")
    List<Review> findByVendorId(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表
     * @param userId 用户 ID
     * @return 评价列表
     */
    @Select("SELECT * FROM review WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<Review> findByUserId(Long userId);

    /**
     * 计算摊位平均评分
     * @param vendorId 摊位 ID
     * @return 平均分
     */
    @Select("SELECT AVG(rating) FROM review WHERE vendor_id = #{vendorId}")
    Double getAverageRating(Long vendorId);

    /**
     * 根据摊位 ID 查询评价列表（关联用户信息）
     * @param vendorId 摊位 ID
     * @return 评价列表（含用户信息）
     */
    @Select("SELECT r.id as reviewId, r.user_id as userId, r.vendor_id as vendorId, " +
            "r.rating, r.content, r.create_time as createTime, " +
            "u.username as userName, u.avatar as userAvatar " +
            "FROM review r " +
            "LEFT JOIN user u ON r.user_id = u.id " +
            "WHERE r.vendor_id = #{vendorId} " +
            "ORDER BY r.create_time DESC")
    List<ReviewWithUserDTO> findByVendorIdWithUser(Long vendorId);

    /**
     * 根据用户 ID 查询评价列表（关联摊位信息）
     * @param userId 用户 ID
     * @return 评价列表（含摊位信息）
     */
    @Select("SELECT r.id as reviewId, r.user_id as userId, r.vendor_id as vendorId, " +
            "r.rating, r.content, r.create_time as createTime, " +
            "v.stall_name as vendorName " +
            "FROM review r " +
            "LEFT JOIN vendor v ON r.vendor_id = v.id " +
            "WHERE r.user_id = #{userId} " +
            "ORDER BY r.create_time DESC")
    List<ReviewWithUserDTO> findByUserIdWithVendor(Long userId);

    /**
     * 统计摊位评价数量
     * @param vendorId 摊位 ID
     * @return 评价数量
     */
    @Select("SELECT COUNT(*) FROM review WHERE vendor_id = #{vendorId}")
    Long countByVendorId(Long vendorId);

    /**
     * 根据评价 ID 查询评价（关联用户 ID）
     * @param reviewId 评价 ID
     * @return 评价对象
     */
    @Select("SELECT * FROM review WHERE id = #{reviewId}")
    Review findByIdWithUser(Long reviewId);
}